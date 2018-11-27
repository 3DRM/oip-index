import bitcoin from 'bitcoinjs-lib'
import coinselect from 'coinselect'
import {sign} from './HelperFunctions/TXSigner'
import MultipartX from './OIPComponents/MultipartX'
import Artifact from './Artifacts/Artifact'
import {flo, flo_testnet} from './networks'

if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
	if (typeof localStorage === "undefined") {
		var LocalStorage = require('node-localstorage').LocalStorage;
		var localStorage = new LocalStorage('./localStorage');
	}
} else {
	localStorage = window.localStorage
}

const CHOP_MAX_LEN = 890;
const FLODATA_MAX_LEN = 1040;

/**
 * Easily publish data onto the FLO chain (mainnet or testnet)
 */
class OIPPublisher {
	/**
	 * Create a new Publisher. Use in conjuction with the Artifact class to publish valid OIP Records or just post random data onto the chain
	 *
	 * ##### Example
	 * Instantiate and use a Publisher
	 * ```
	 * let wif = "cRVa9rNx5N1YKBw8PhavegJPFCiYCfC4n8cYmdc3X1Y6TyFZGG4B"
	 * network = "testnet" //defaults to mainnet
	 * let publisher = new OIPPublisher(wif, network)
	 *
	 * //Publish arbitrary data
	 * publisher.publishData('Hello, Testnet)').then(txid => txid).catch(err => err)
	 *
	 * //Publish data when using the OIP Spec
	 * let artifact = new Artifact()
	 * publisher.publish(artifact.toString()).then(response => response).catch(err => err)
	 * ```
	 *
	 * @class
	 * @param {string} wif - private key in Wallet Import Format (WIF)
	 * @param {string} [network="mainnet"] - Use "testnet" for testnet
	 *
	 * @return {OIPPublisher}
	 */
	//ToDo:: Switch to mainnet for prod
	constructor(wif, network = "testnet") {
		if (network === "testnet")
			network = flo_testnet
		else network = flo

		this.coininfo = network
		this.network = network.network
		this.explorer = network.explorer
		this.ECPair = bitcoin.ECPair.fromWIF(wif, network.network)
		this.p2pkh = bitcoin.payments.p2pkh({pubkey: this.ECPair.publicKey, network: this.network}).address
	}

	/**
	 * Publish string data to the chain
	 * @param {string} input - the string data you wish to publish
	 * @return {Promise<string|Array<string>>} - the txid(s) of the broadcasted messages
	 */
	async publish(input) {
		if (!typeof input === 'string') {
			throw new Error(`Input must be of type string`)
		}
		let broadcast_string = `{oip042:${message}}`

		if (broadcast_string.length > FLODATA_MAX_LEN) {
			let txids
			try {
				txids = await this.publishtMultiparts(broadcast_string)
			} catch (err) {
				throw new Error(`Failed to broadcast multiparts: ${err}`)
			}
			return txids
		} else {
			let txid
			try {
				txid = await this.publishMessage("json:" + broadcast_string)
			} catch (err) {
				throw new Error(`Failed to broadcast message: ${err}`)
			}
			return txid
		}
	}

	async publishMessage(floData) {
		let hex
		try {
			hex = await this.buildTX(floData)
		} catch (err) {
			throw new Error(`Error building TX Hex: ${err}`)
		}
		let txid
		try {
			txid = await this.broadcastMessage(hex)
		} catch (err) {
			throw new Error(`Error broadcasting TX Hex: ${err}`)
		}
		return txid
	}

	async publishtMultiparts(input) {
		let mpx = new MultipartX(input)
		let mps = mpx.toMultiParts()

		let txids = []

		for (let mp of mps) {
			if (txids.length > 0) {
				mp.setFirstPartTXID(txids[0])
				mp.sign(this._address) //@ToDO: add address
			}

			try {
				let txid = await this.broadcastMessage(mp.toString())
				txids.push(txid)
			} catch (err) {
				throw new Error(`Failed to broadcase mp single: ${err}`)
			}
		}
	}

	async buildTX(floData) {
		let selected
		try {
			selected = await this.buildInputsAndOutputs(floData)
		} catch (err) {
			throw new Error(`Failed to build inputs and outputs: ${err}`)
		}

		// console.log('selected: ', selected)
		let {inputs, outputs, fee} = selected

		// inputs and outputs will be undefined if no solution was found
		if (!inputs || !outputs) {
			throw new Error("No Inputs or Outputs selected! Fail!")
		}

		let txb = new bitcoin.TransactionBuilder(this.network)

		txb.setVersion(this.coininfo.txVersion) //1: w/o floData, 2: w/ floData

		inputs.forEach(input => txb.addInput(input.txId, input.vout))

		// Check if we are paying to ourself, if so, merge the outputs to just a single output.
		// Check if we have two outputs (i.e. pay to and change)
		if (outputs.length === 2) {
			// If the first input is sending to the from address, and there is a change output,
			// then merge the outputs.
			if (outputs[0].address === this.p2pkh && !outputs[1].address) {
				let totalToSend = outputs[0].value + outputs[1].value
				outputs = [{
					address: this.p2pkh,
					value: totalToSend
				}]
			}
		}

		outputs.forEach(output => {
			if (!output.address) {
				throw new Error(`Missing output address on line #164: ${outputs}`)
			}
			txb.addOutput(output.address, output.value)
		})

		let extraBytes = this.coininfo.getExtraBytes({floData})

		for (let i in inputs) {
			if (this.p2pkh !== inputs[i].address) throw new Error(`Invalid inputs. Addresses don't match on line #170: ${inputs} & ${this.p2pkh}`)
			sign(txb, extraBytes, parseInt(i), this.ECPair)
		}

		let builtHex

		try {
			builtHex = txb.build().toHex();
		} catch (e) {
			throw new Error("Unable to build Transaction Hex! \n" + e)
		}

		builtHex += extraBytes

		return builtHex
	}

	async buildInputsAndOutputs(floData) {
		let utxo
		try {
			utxo = await this.getUTXO()
		} catch (err) {
			throw err
		}

		if (utxo.length === 0) {
			throw new Error(`P2PKH: ${this.p2pkh} has no unspent transaction outputs.`)
		}

		let formattedUtxos = utxo.map(utxo => {
			return {
				address: utxo.address,
				txId: utxo.txid,
				vout: utxo.vout,
				scriptPubKey: utxo.scriptPubKey,
				value: utxo.satoshis,
				confirmations: utxo.confirmations
			}
		})

		let output = {
			address: this.p2pkh,
			value: Math.floor(0.0001 * this.coininfo.satPerCoin)
		}

		let targets = [output]

		let extraBytes = this.coininfo.getExtraBytes({floData});
		let extraBytesLength = extraBytes.length

		console.log(formattedUtxos)

		let utxosNoUnconfirmed = formattedUtxos.filter(utx => utx.confirmations > 0)

		console.log(utxosNoUnconfirmed)
		//ToDo:: Filter unconfirmed check

		let selected = coinselect(utxosNoUnconfirmed, targets, Math.ceil(this.coininfo.feePerByte), extraBytesLength)

		// Check if we are able to build inputs/outputs off only unconfirmed transactions with confirmations > 0
		if (!selected.inputs || selected.inputs.length === 0 || !selected.outputs || selected.outputs.length === 0 || !selected.fee) {
			selected = coinselect(formattedUtxos, targets, Math.ceil(this.coininfo.feePerByte), extraBytesLength)
		}

		return selected
	}

	async getUTXO() {
		let utxo
		try {
			utxo = await this.explorer.getAddressUtxo(this.p2pkh)
		} catch (err) {
			throw new Error(`Error fetching UTXO: ${err}`)
		}
		return utxo
	}

	async broadcastMessage(hex) {
		let txid
		try {
			txid = await this.explorer.broadcastRawTransaction(hex)
		} catch (err) {
			throw new Error(`Failed to broadcast TX Hex: ${err}`)
		}
		return txid
	}
}

export default OIPPublisher