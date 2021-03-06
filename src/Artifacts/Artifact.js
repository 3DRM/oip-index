import ArtifactFile from '../OIPComponents/ArtifactFile.js';
import Multipart from '../OIPComponents/Multipart.js';
import ArtifactPicker from '../Functions/ArtifactPicker'

const DEFAULT_NETWORK = "IPFS";
const SUPPORTED_TYPES = ["Audio", "Video", "Image", "Text", "Software", "Web", "Research", "Property"]


const CHOP_MAX_LEN = 890;
const FLODATA_MAX_LEN = 1040;
/**
 * @typedef {Object} StatusObject
 * @property {Boolean} success - If the attempt was successful
 * @property {string} error - The error text (if there was an error)
 */

/**
 * An Artifact contains metadata about a file/piece of content,
 * along with a location on a network to find that file,
 * and optionally payment information.
 *
 * Create a new Artifact
 * This function is an es5 constructor that returns a new Artifact class based on the version of the artifact/record
 * ##### Examples
 * Create a blank Artifact
 * ```
 * import { Artifact } from 'oip-index'
 *
 * let artifact = Artifact()
 * ```
 * Create an Artifact from JSON
 * ```
 * import { Artifact } from 'oip-index'
 *
 * let artifact = Artifact({
	"artifact": {
		"publisher": "FPkvwEHjddvva2smpYwQ4trgudwFcrXJ1X",
		"payment": {
			"addresses": [],
			"retailer": 15,
			"sugTip": [],
			"fiat": "USD",
			"scale": "1000:1",
			"promoter": 15,
			"maxdisc": 30
		},
		"storage": {
			"files": [
				{
					"fname": "headshot.jpg",
					"fsize": 100677,
					"type": "Image"
				}
			],
			"location": "QmUjSCcBda9YdEUKVLPQomHzSatwytPqQPAh4fdMiRV8bp",
			"network": "IPFS"
		},
		"type": "Image-Basic",
		"info": {
			"title": "Headshot",
			"extraInfo": {
				"artist": "David Vasandani",
				"genre": "People"
			}
		},
		"timestamp": 1531065099
	},
	"meta": {
		"block_hash": "a2ca4c3f06032dc4f9df7eca829b42b91da9595dbe9f4623a1c7f92a5508cfb9",
		"txid": "5f399eef8f93c03502efbd51691350cbacbf3c16eba228409bf7453ffff78207",
		"block": 2832215,
		"time": 1531065167,
		"type": "oip041"
	}
})
 * ```
 * Create an Artifact from a JSON string
 * ```
 * import { Artifact } from 'oip-index'
 *
 * let artifact = new Artifact("{"artifact":{"publisher":"FPkvwEHjddvva2smpYwQ4trgudwFcrXJ1X","payment":{"addresses":[],"retailer":15,"sugTip":[],"fiat":"USD","scale":"1000:1","promoter":15,"maxdisc":30},"storage":{"files":[{"fname":"headshot.jpg","fsize":100677,"type":"Image"}],"location":"QmUjSCcBda9YdEUKVLPQomHzSatwytPqQPAh4fdMiRV8bp","network":"IPFS"},"type":"Image-Basic","info":{"title":"Headshot","extraInfo":{"artist":"David Vasandani","genre":"People"}},"timestamp":1531065099},"meta":{"block_hash":"a2ca4c3f06032dc4f9df7eca829b42b91da9595dbe9f4623a1c7f92a5508cfb9","txid":"5f399eef8f93c03502efbd51691350cbacbf3c16eba228409bf7453ffff78207","block":2832215,"time":1531065167,"type":"oip041"}}")
 * ```
 * @class Artifact
 * @param  {Array<Multipart>|string|Object} input - Pass in either an array of Multiparts, an Artifact JSON string, or an Artifact JSON object to be loaded from
 * @return {Artifact}
 */
export default function Artifact(input) {
	if (!(this instanceof Artifact)) {
		//return new Artifact based on type of input
		return ArtifactPicker(input)
	}

	this.artifactType = 'generic'
	this.artifactSubtype = 'record'

	this._source = input

	this.artifact = {
		floAddress: "",
		info: {},
		details: {},
		storage: {network: DEFAULT_NETWORK, files: []},
		payment: {},
		type: undefined,
		subtype: undefined,
		signature: undefined,
		timestamp: undefined,
	}

	this.meta = {
		block: undefined,
		block_hash: undefined,
		deactivated: false,
		signature: undefined,
		time: undefined,
		tx: undefined,
		txid: undefined,
		type: undefined,
	}

	this.FileObjects = [];

	/**
	 * Returns the Artifact Type (to be used before class initialization)
	 * @returns {string}
	 */
	Artifact.prototype.getArtifactType = function () {
		return "generic"
	}

	/**
	 * Return the Artifact Subtype (to be used before class initialization)
	 * @returns {string}
	 */
	Artifact.prototype.getArtifactSubtype = function () {
		return 'record'
	}

	/**
	 * Returns the Artifact Type and Subtype Concatenated (to be used before class initialization)
	 * @returns {string} return the artifact type concatenated with the artifact subtype
	 * @example
	 * //return
	 * "type-subtype"
	 */
	Artifact.prototype.getTypeAndSubtype = function () {
		return 'generic-record'
	}

	/**
	 * Returns the Artifact Type (to be used after class initialization)
	 * @returns {string} return the artifact type concatenated with the artifact subtype
	 * @example
	 * //return
	 * "type-subtype"
	 */
	Artifact.prototype.getInternalTypeAndSubtype = function () {
		return this.artifactType + '-' + this.artifactSubtype
	}

	/**
	 * Returns the original data fed to the constructor
	 * @returns {*}
	 */
	Artifact.prototype._getSource = function () {
		return this._source
	}

	/**
	 * Set source data (DANGEROUS!!). Resets the original data fed into the constructor
	 * @param data
	 * @private
	 */
	Artifact.prototype._setSourceData = function (data) {
		this._source = data
	}

	/**
	 * Set TXID
	 * @param txid
	 */
	Artifact.prototype.setTXID = function (txid) {
		this.meta.txid = txid
	}

	/**
	 * Get TXID
	 * @return {string} txid
	 */
	Artifact.prototype.getTXID = function () {
		return this.meta.txid
	}

	/**
	 * Set the Publisher name String, please note that this does not set it when you publish to the blockchain!
	 * @param {string} publisherName - The Publisher Name you wish to set the Artifact to
	 * @example
	 * artifact.setPublisherName("My Publisher Name")
	 */
	Artifact.prototype.setPublisherName = function (pubName) {
		this.publisherName = pubName;
	}

	/**
	 * Get the Publisher Name for the Artifact
	 * @example
	 * let pubName = artifact.getPublisherName()
	 * @return {string} Returns the Publisher Name if defined, or the Main Address if the publisher name is undefined
	 */
	Artifact.prototype.getPublisherName = function () {
		return this.publisherName || this.getMainAddress()
	}

	/**
	 * Set the Main Address that you will be signing the Artifact with
	 * @example
	 * artifact.setMainAddress("FLZXRaHzVPxJJfaoM32CWT4GZHuj2rx63k")
	 * @param {string} address - The Main Address that will be signing the Artifact
	 */
	Artifact.prototype.setMainAddress = function (address) {
		this.artifact.floAddress = address;
	}

	/**
	 * Get the Main Address that the Artifact is signed with
	 * @example
	 * let mainAddress = artifact.getMainAddress()
	 * @return {string}
	 */
	Artifact.prototype.getMainAddress = function () {
		return this.artifact.floAddress
	}

	/**
	 * Set publish/signature timestamp for the Artifact
	 * @example
	 * artifact.setTimestamp(Date.now())
	 * @param {number} time - The Timestamp you wish to set the Artifact to
	 */
	Artifact.prototype.setTimestamp = function (time) {
		if (typeof time === "number") {
			if (String(time).length === 13) {
				let seconds_time_string = parseInt(time / 1000)
				this.artifact.timestamp = seconds_time_string
			} else if (String(time).length === 10) {
				this.artifact.timestamp = time;
			}
		}
	}

	/**
	 * Get the publish/signature timestamp for the Artifact
	 * @example
	 * let timestamp = artifact.getTimestamp()
	 * @return {number} Returns `undefined` if timestamp is not yet set
	 */
	Artifact.prototype.getTimestamp = function () {
		return this.artifact.timestamp
	}

	/**
	 * Set the Artifact Title
	 * @example
	 * artifact.setTitle("Example Title")
	 * @param {string} title - The desired Title you wish to set the Artifact to
	 */
	Artifact.prototype.setTitle = function (title) {
		this.artifact.info.title = title;
	}

	/**
	 * Get the Artifact Title
	 * @example
	 * let title = artifact.getTitle()
	 * @return {string}
	 */
	Artifact.prototype.getTitle = function () {
		return this.artifact.info.title || ""
	}

	/**
	 * Set the Description of the Artifact
	 * @example
	 * artifact.setDescription("My Description")
	 * @param {string} description - The Description you wish to set
	 */
	Artifact.prototype.setDescription = function (description) {
		this.artifact.info.description = description;
	}

	/**
	 * Get the Description of the Artifact
	 * @example
	 * let description = artifact.getDescription()
	 * @return {string}
	 */
	Artifact.prototype.getDescription = function () {
		return this.artifact.info.description || ""
	}

	/**
	 * Set the Type of the Artifact
	 * @example
	 * artifact.setType("Video")
	 * @param {string} type - Must be one of the following supported Artifact Main Types ["Audio", "Video", "Image", "Text", "Software", "Web", "Research", "Property"]
	 */
	Artifact.prototype.setType = function (type) {
		type = this.capitalizeFirstLetter(type);

		if (SUPPORTED_TYPES.indexOf(type) === -1) {
			return "Type Not Supported!";
		}

		this.artifact.type = type;
	}

	/**
	 * Get the Type of the Artifact
	 * @example
	 * let type = artifact.getType()
	 * @return {string}
	 */
	Artifact.prototype.getType = function () {
		return this.artifact.type
	}

	/**
	 * Set the Subtype of the Artifact
	 * @example
	 * artifact.setSubtype("Album")
	 * @param {string} subtype - The desired Subtype for the Artifact
	 */
	Artifact.prototype.setSubtype = function (subtype) {
		subtype = this.capitalizeFirstLetter(subtype);

		this.artifact.subtype = subtype;
	}

	/**
	 * Get the Subtype of the Artifact
	 * @example
	 * let subtype = artifact.getSubtype()
	 * @return {string}
	 */
	Artifact.prototype.getSubtype = function () {
		return this.artifact.subtype
	}

	/**
	 * Set the Year that the content was originally published
	 * @example
	 * artifact.setYear(2018)
	 * @param {number} year - The Year that the content was originally published
	 */
	Artifact.prototype.setYear = function (year) {
		if (typeof year === "number")
			this.artifact.info.year = year;
	}

	/**
	 * Get the Year that the content was originally published
	 * @example
	 * let year = artifact.getYear()
	 * @return {number}
	 */
	Artifact.prototype.getYear = function () {
		return this.artifact.info.year
	}

	/**
	 * Set if the Artifact is NSFW
	 * @example
	 * artifact.setNSFW(true)
	 * @param {Boolean} nsfwToggle - `true` or `false` depending on the content of the Artifact
	 */
	Artifact.prototype.setNSFW = function (nsfwToggle) {
		this.artifact.info.nsfw = nsfwToggle;
	}

	/**
	 * Get if the Artifact is marked NSFW
	 * @example
	 * let nsfw = artifact.getNSFW()
	 * @return {Boolean}
	 */
	Artifact.prototype.getNSFW = function () {
		return this.artifact.info.nsfw || false
	}

	/**
	 * Set the Tags for the Artifact
	 * @example
	 * artifact.setTags(["Tag 1", "Tag 2", "Tag 3"])
	 * @param {Array.<string>} tags - Pass in an Array of tags
	 */
	Artifact.prototype.setTags = function (tags) {
		if (Array.isArray(tags)) {
			this.artifact.info.tags = tags;
		} else {
			if (tags.split(", ").length > 1) {
				this.artifact.info.tags = tags.split(", ")
			} else {
				this.artifact.info.tags = [tags]
			}
		}
	}

	/**
	 * Get the Tags for the Artifact
	 * @example
	 * let tags = artifact.getTags()
	 * @return {Array.<string>}
	 */
	Artifact.prototype.getTags = function () {
		return this.artifact.info.tags || []
	}

	/**
	 * Set a specific Detail on the Artifact
	 * @param {string} detail - Where should we place this detail (i.e. "artist")
	 * @example
	 * artifact.setDetail("artist", "Artist Name")
	 * @param {Object} info - The item you wish to set to the detail node
	 */
	Artifact.prototype.setDetail = function (detail, info) {
		this.artifact.details[detail] = info
	}

	/**
	 * Get a specific Detail back from the Artifact
	 * @param  {string} detail - The detail you want pack (i.e. "artist")
	 * @example
	 * let artist = artifact.getDetail("artist")
	 * @return {Object}
	 */
	Artifact.prototype.getDetail = function (detail) {
		return this.artifact.details[detail]
	}

	/**
	 * Set the Signature of the Artifact
	 * @example
	 * artifact.setSignature("IO0i5yhuwDy5p93VdNvEAna6vsH3UmIert53RedinQV+ScLzESIX8+QrL4vsquCjaCY0ms0ZlaSeTyqRDXC3Iw4=")
	 * @param {string} signature - The signature of the Artifact
	 */
	Artifact.prototype.setSignature = function (signature) {
		this.artifact.signature = signature
		this.meta.signature = signature
	}

	/**
	 * Get the Signature of the Artifact
	 * @example
	 * let signature = artifact.getSignature()
	 * @return {string} Returns `undefined` if signature is not set
	 */
	Artifact.prototype.getSignature = function () {
		return this.artifact.signature
	}

	/**
	 * Set the Storage Network of the Artifact
	 * @example <caption>Set Network to IPFS</caption
	 * artifact.setNetwork("IPFS")
	 * @example <caption>Set Network to Storj (Support coming Soon)</caption
	 * artifact.setNetwork("Storj")
	 * @param {string} network - The Storage Network where we can find the file at Location
	 */
	Artifact.prototype.setNetwork = function (network) {
		if (network === "ipfs")
			network = "IPFS"

		this.artifact.storage.network = network;
	}

	/**
	 * Get the Storage Network for the Artifact
	 * @example
	 * let mainAddress = artifact.getMainAddress()
	 * @return {string}
	 */
	Artifact.prototype.getNetwork = function () {
		return this.artifact.storage.network
	}

	/**
	 * Set the Storage Location
	 * @example
	 * artifact.setLocation("QmNmVHfXuh5Tub76H1fog7wSM8of4Njfm2j1oTg8ZYUBZm")
	 * @param {string} location - The Location of the files on the Storage Network
	 */
	Artifact.prototype.setLocation = function (location) {
		this.artifact.storage.location = location;
	}

	/**
	 * Get the Storage Location
	 * @example
	 * let location = artifact.getLocation()
	 * @return {string}
	 */
	Artifact.prototype.getLocation = function () {
		return this.artifact.storage.location
	}

	/**
	 * Set the Fiat to be used in Payment Calculations. Only "usd" is supported right now.
	 * @example
	 * artifact.setPaymentFiat("usd")
	 * @param {string} fiat - The Fiat type you wish to accept
	 */
	Artifact.prototype.setPaymentFiat = function (fiat) {
		this.artifact.payment.fiat = fiat;
	}

	/**
	 * Get the Fiat type to be used in Payment Calculations
	 * @example
	 * let fiat = artifact.getPaymentFiat()
	 * @return {string} Returns undefined if no fiat is set
	 */
	Artifact.prototype.getPaymentFiat = function t() {
		return this.artifact.payment.fiat
	}

	/**
	 * Set the Payment Scale to use in Payment Calculations
	 * @example
	 * artifact.setPaymentScale(1000)
	 * @param {number} newScale - The new Scale that should be used
	 */
	Artifact.prototype.setPaymentScale = function (newScale) {
		this.artifact.payment.scale = newScale;
	}

	/**
	 * Get the payment scale for use in Payment Calculations
	 * @example
	 * let scale = artifact.getPaymentScale()
	 * @return {number} Returns 1 if no payment scale is set (aka, 1:1 scale)
	 */
	Artifact.prototype.getPaymentScale = function () {
		//	Check if scale is a string
		// 		If so, check if the string is a number, or represented as a ratio
		// 			return the parsed number or ratio bound
		if (this.artifact.payment.scale) {
			if (typeof this.artifact.payment.scale === "string") {
				if (isNaN(this.artifact.payment.scale) && this.artifact.payment.scale.split(":").length === 2) {
					return parseInt(this.artifact.payment.scale.split(":")[0])
				} else if (!isNaN(this.artifact.payment.scale)) {
					return parseInt(this.artifact.payment.scale)
				}
			}

			return this.artifact.payment.scale
		} else {
			// Return 1:1 scale if undefined! The user should ALWAYS set scale ON PUBLISH if they are using a scale!
			return 1;
		}
	}

	/**
	 * Set suggested tip values to use. These tip values are the fiat value, divided by the scale you set.
	 * @example
	 * artifact.setSuggestedTip([10, 100, 1000])
	 * @param {Array<number>} suggestedTipArray - The Suggested Tips you wish to define
	 */
	Artifact.prototype.setSuggestedTip = function (suggestedTipArray) {
		this.artifact.payment.tips = suggestedTipArray;
	}

	/**
	 * Get what the user has defined as their suggested tip values
	 * @example
	 * let tips = artifact.getSuggestedTip()
	 * @return {Array<number>}
	 */
	Artifact.prototype.getSuggestedTip = function () {
		return this.artifact.payment.tips || []
	}

	/**
	 * !!! NOT YET IMPLEMENTED !!!
	 * Add Token Rule to the Artifact
	 * @param {TokenRule} tokenRule - The Token Rule to add to the Artifact
	 */
	Artifact.prototype.addTokenRule = function (tokenRule) {
		this.artifact.payment.tokens.push(tokenRule);
	}

	/**
	 * !!! NOT YET IMPLEMENTED !!!
	 * Get Token Rules from the Artifact
	 * @return {Array.<TokenRule>}
	 */
	Artifact.prototype.getTokenRules = function () {
		return this.artifact.payment.tokens
	}

	/**
	 * Accept Payments for a specific coin
	 * @param {string} coin - The string coin ticker
	 * @param {string} address - Base58 Public Key to send payments
	 */
	Artifact.prototype.addSinglePaymentAddress = function (coin, address) {
		if (!this.artifact.payment.addresses)
			this.artifact.payment.addresses = {};
		let tmpObj = {};
		tmpObj[coin.toLowerCase()] = address;
		this.artifact.payment.addresses = {...this.artifact.payment.addresses, ...tmpObj}
	}

	/**
	 * Get the Address(es) to send Payments to for specific coins
	 * @param {(string|Array.<string>)} coins - A string or an array of strings of the coins you wish to fetch the addresses for
	 * @example
	 * let address = artifact.getPaymentAddress(["btc", "ltc"])
	 * { btc: "19HuaNprtc8MpG6bmiPoZigjaEu9xccxps",
		ltc: "LbpjYYPwYBjoPQ44PrNZr7nTq7HkYgcoXN"}
	 * @return {Object} - keyValue => [string][string] === [coin][address]
	 */
	Artifact.prototype.getPaymentAddress = function (coins) {
		if ((!this.artifact.payment.addresses || this.artifact.payment.addresses === {}) && this.getMainAddress() && this.getMainAddress() !== "")
			return {flo: this.getMainAddress()}

		let tmpObj = {}

		if (Array.isArray(coins)) {
			for (let coin of coins) {
				for (let _coin in this.artifact.payment.addresses) {
					if (coin === _coin)
						tmpObj[coin] = this.artifact.payment.addresses[coin]
				}
			}
		} else if (typeof coins === "string") {
			tmpObj[coins] = this.artifact.payment.addresses[coins]
		}

		return tmpObj
	}

	/**
	 * Get the Addresses to send Payment to
	 * @example
	 * let addresses = artifact.getPaymentAddresses()
	 * @return {Object} - keyValue => [string][string] === [coin][address]
	 */
	Artifact.prototype.getPaymentAddresses = function (coins) {
		if ((!this.artifact.payment.addresses || this.artifact.payment.addresses === {}) && this.getMainAddress() && this.getMainAddress() !== "")
			return {flo: this.getMainAddress()}

		let tmpObj = {};
		if (coins) {
			if (Array.isArray(coins)) {
				for (let _coin in this.artifact.payment.addresses) {
					for (let coin of coins) {
						if (coin === _coin) {
							tmpObj[coin] = this.artifact.payment.addresses[coin]
						}
					}
				}
				return tmpObj
			} else if (typeof coins === "string") {
				tmpObj[coins] = this.artifact.payment.addresses[coins]
				return tmpObj
			}
		}

		return this.artifact.payment.addresses || {}
	}

	/**
	 * Get the supported payment coins
	 * @param {(string|Array.<String>)} [coins] - coins you want to check against
	 * @example
	 * let supportedCoins = artifact.getSupportedCoins()
	 * @return {(String|Array.<String>)}
	 */
	Artifact.prototype.getSupportedCoins = function (coins) {
		let coin_check = coins || undefined
		let supported_coins = [];
		let addrs = this.getPaymentAddresses()
		if (typeof addrs === "object") {
			for (let coin in addrs) {
				supported_coins.push(coin)
			}
		} else {
			throw new Error("Invalid parameter. Expecting an Array of Objects: [{[coin][addr]},]")
		}

		if (coin_check) {
			if (Array.isArray(coin_check)) {
				let _coins = []
				for (let my_coin of coin_check) {
					for (let sup_coin of supported_coins) {
						if (my_coin === sup_coin)
							_coins.push(my_coin)
					}
				}
				return _coins
			} else if (typeof coin_check === "string") {
				if (supported_coins.includes(coin_check)) {
					return coin_check
				}
				else {
					return ""
				}
			}
		}

		return supported_coins
	}

	/**
	 * Get the Addresses to send Tips to
	 * @example
	 * let addresses = artifact.getPaymentAddresses()
	 * @return {Object} - keyValue => [string][string] === [coin][address]
	 */
	Artifact.prototype.getTipAddresses = function () {
		return this.getPaymentAddresses()
	}

	/**
	 * Set the cut you want to send to Retailers for selling your content
	 * @example
	 * artifact.setRetailerCut(10)
	 * @param {number} newCut - The new cut you want sent to Retailers
	 */
	Artifact.prototype.setRetailerCut = function (newCut) {
		if (typeof newCut === "number")
			this.artifact.payment.retailer = newCut;
	}

	/**
	 * Get the cut that the user wants to send to Retailers for selling their content
	 * @example
	 * let retailerCut = artifact.getRetailerCut()
	 * @return {number}
	 */
	Artifact.prototype.getRetailerCut = function () {
		return this.artifact.payment.retailer || 0
	}

	/**
	 * Set the cut you want to send to Promoters for sharing your content
	 * @example
	 * artifact.setPromoterCut(10)
	 * @param {number} newCut - The new cut you want sent to Retailers
	 */
	Artifact.prototype.setPromoterCut = function (newCut) {
		if (typeof newCut === "number")
			this.artifact.payment.promoter = newCut;
	}

	/**
	 * Get the cut that the user wants to send to Promoters for sharing their content
	 * @example
	 * let promoterCut = artifact.getPromoterCut()
	 * @return {number}
	 */
	Artifact.prototype.getPromoterCut = function () {
		return this.artifact.payment.promoter || 0
	}

	/**
	 * Set the maximum discount percent that Retailers can discount your content by during a sale
	 * @example
	 * artifact.setMaxDiscount(20)
	 * @param {number} newMax - The new maximim discount percentage
	 */
	Artifact.prototype.setMaxDiscount = function (newMax) {
		if (typeof newMax === "number")
			this.artifact.payment.maxdisc = newMax;
	}

	/**
	 * Get the maximum discount percent that Retailers can discount the content by during a sale
	 * @example
	 * let maxDiscount = artifact.getMaxDiscount()
	 * @return {number}
	 */
	Artifact.prototype.getMaxDiscount = function () {
		return this.artifact.payment.maxdisc || 0
	}

	/**
	 * Add a File to the Artifact
	 * @param {ArtifactFile} file - The file you wish to add
	 */
	Artifact.prototype.addFile = function (file) {
		if (file instanceof ArtifactFile) {
			this.FileObjects.push(new ArtifactFile(file.toJSON(), this));
		} else if (typeof file === "object" || typeof file === "string") {
			this.FileObjects.push(new ArtifactFile(file, this));
		}
	}

	/**
	 * Get all the Files on the Artifact
	 * @return {Array.<ArtifactFile>}
	 */
	Artifact.prototype.getFiles = function () {
		return this.FileObjects
	}

	/**
	 * Get the Thumbnail file if it exists
	 * @return {ArtifactFile} Returns undefined if no file is matched
	 */
	Artifact.prototype.getThumbnail = function () {
		for (let file of this.getFiles()) {
			if (file.getType() === "Image" && file.getSubtype() === "Thumbnail" && file.getSuggestedPlayCost() === 0) {
				return file;
			}
		}

		for (let file of this.getFiles()) {
			if (file.getType() === "Image" && file.getSuggestedPlayCost() === 0) {
				return file;
			}
		}

		return undefined;
	}

	/**
	 * Get the "simple" Duration of the Artifact.
	 * This gets the duration of the first file that has a duration.
	 * @return {number} Returns undefined if there is no match to a duration
	 */
	Artifact.prototype.getDuration = function () {
		for (let file of this.getFiles()) {
			if (!isNaN(file.getDuration())) {
				return file.getDuration();
			}
		}
		return undefined;
	}

	/**
	 * Check if an Artifact is Valid and has all the required fields to be Published
	 * @return {StatusObject}
	 */
	Artifact.prototype.isValid = function () {
		if (!this.artifact.info.title || this.artifact.info.title === "") {
			return {success: false, error: "Artifact Title is a Required Field"}
		}
		if (!this.artifact.floAddress || this.artifact.floAddress === "") {
			return {success: false, error: "floAddress is a Required Field!"}
		}

		return {success: true}
	}

	/**
	 * Check if the Artifact is Paid. An Artifact is defined as paid if any files have a cost.
	 * @return {Boolean}
	 */
	Artifact.prototype.isPaid = function () {
		let files = this.getFiles();

		if (files) {
			for (let file of files) {
				if (file.isPaid()) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Set block [height]
	 */
	Artifact.prototype.setBlock = function (block) {
		this.meta.block = block
	}

	/**
	 * Get block [height]
	 */
	Artifact.prototype.getBlock = function () {
		return this.meta.block
	}

	/**
	 * Set block hash
	 * @param blockHash
	 */
	Artifact.prototype.setBlockHash = function (blockHash) {
		this.meta.block_hash = blockHash
	}

	/**
	 * Get block hash
	 */
	Artifact.prototype.getBlockHash = function () {
		return this.meta.block_hash
	}

	/**
	 * Set deactivation status
	 * @param {boolean} status
	 */
	Artifact.prototype.setDeactivated = function (status) {
		this.meta.deactivated = status
	}

	/**
	 * Get deactivation status
	 * @returns {boolean}
	 */
	Artifact.prototype.getDeactivated = function () {
		return this.meta.deactivated
	}

	/**
	 * Set time (unix timestamp of block creation)
	 * @param time
	 */
	Artifact.prototype.setTime = function (time) {
		this.meta.time = time
	}

	/**
	 * Get the unix timestamp of the block creation)
	 * @returns {undefined|*}
	 */
	Artifact.prototype.getTime = function () {
		return this.meta.time
	}

	/**
	 * Set Artifact Version type
	 * @param type
	 */
	Artifact.prototype.setVersionType = function (type) {
		this.meta.type = type
	}

	/**
	 * Get Artifact Version type
	 */
	Artifact.prototype.getVersionType = function () {
		return this.meta.type
	}

	/**
	 * Get the Artifact object
	 * @return {Object}
	 */
	Artifact.prototype.getArtifact = function () {
		return this.artifact
	}

	/**
	 * Get the Meta Object
	 * @return {Object}
	 */
	Artifact.prototype.getMeta = function() {
		return this.meta
	}

	/**
	 * Get the Artifact JSON. This is the "Dehydrated" version of this class.
	 * @return {Object}
	 */
	Artifact.prototype.toJSON = function () {
		this.artifact.storage.files = [];

		for (let file of this.FileObjects) {
			this.artifact.storage.files.push(file.toJSON())
		}

		let retJSON = {
			artifact: this.getArtifact(),
			meta: this.getMeta()
		}


		return JSON.parse(JSON.stringify(retJSON))
	}

	/**
	 * Load the Artifact from JSON. This "Hydrates" this class with the "Dehydrated" info.
	 * @param  {Object} artifact - The specific Artifact JSON
	 * @return {StatusObject}
	 */
	Artifact.prototype.fromJSON = function (artifact) {
		if (artifact) {
			if (!artifact.meta) {
				if (artifact['media-data']) {
					if (artifact['media-data']['alexandria-media']) {
						this.setVersionType("alexandria-media")
						return this.importAlexandriaMedia(artifact['media-data']['alexandria-media'])
					} else {
						return {success: false, error: "No Artifact_DEPRECATED under Version!"}
					}
				} else if (artifact['oip-041']) {
					this.setVersionType("oip041")
					if (artifact['oip-041'].signature) {
						this.setSignature(artifact['oip-041'].signature)
					}
					if (artifact['oip-041'].artifact) {
						return this.import041(artifact['oip-041'].artifact)
					} else {
						return {success: false, error: "No Artifact_DEPRECATED under Version!"}
					}
				} else if (artifact.oip042) {
					if (artifact.oip042.signature) {
						this.setSignature(artifact.oip042.signature)
					}
					if (artifact.oip042.artifact) {
						this.setVersionType("oip042")
						return this.import042(artifact.oip042.artifact)
					} else if (artifact.oip042.publish && artifact.oip042.publish.artifact) {
						return this.import042(artifact.oip042.publish.artifact)
					} else {
						return {success: false, error: "No Artifact_DEPRECATED under Version!"}
					}
				}
			}

			this.setBlock(artifact.meta.block)
			this.setBlockHash(artifact.meta.block_hash)
			this.setDeactivated(artifact.meta.deactivated || false)
			this.setSignature(artifact.meta.signature)
			this.setTXID(artifact.meta.txid);
			this.setTime(artifact.meta.time)
			this.setVersionType(artifact.meta.type)

			switch (artifact.meta.type) {
				case 'alexandria-media':
					this.importAlexandriaMedia(artifact.artifact)
					break
				case 'oip041':
					this.import041(artifact.artifact)
					break
				case 'oip042':
					this.import042(artifact.artifact)
					break
				default:
					return {success: false, error: 'Unsupported media type. Check artifact.meta.type', detail: artifact}
			}
		} else {
			return {success: false, error: "Artifact Not Provided!"}
		}
	}

	/**
	 * Returns a string version of the .toJSON() function
	 * @return {string}
	 */
	Artifact.prototype.toString = function () {
		return JSON.stringify(this.toJSON())
	}

	/**
	 * Hydrate an alexandria-media JSON object
	 * @param artifact
	 */
	Artifact.prototype.importAlexandriaMedia = function (artifact) {
		if (artifact.publisher) {
			this.setMainAddress(artifact.publisher)
		}
		if (artifact.timestamp) {
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type) {
			let type = artifact.type;

			if (type === "music") {
				type = "Audio"
			}
			if (type === "book") {
				type = "Text"
				this.setSubtype("Book")
			}
			if (type === "thing") {
				type = "Web"
			}

			this.setType(type)
		}
		if (artifact.torrent) {
			this.setLocation(artifact.torrent)

			if (artifact.torrent.split(":")[0] === "btih") {
				this.setNetwork("bittorrent")
			}
		}
		if (artifact.info) {
			if (artifact.info.title) {
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description) {
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year) {
				this.setYear(artifact.info.year)
			}

			if (artifact.info['extra-info']) {
				let tmpFiles = [];
				let hadFiles = false;
				for (let key in artifact.info['extra-info']) {
					if (artifact.info['extra-info'].hasOwnProperty(key)) {
						switch (key) {
							case 'tags':
								this.setTags(artifact.info['extra-info'][key])
								break
							case 'Bitcoin Address':
								this.addSinglePaymentAddress("btc", artifact.info['extra-info'][key])
								break
							case 'DHT Hash':
								let hash = artifact.info['extra-info'][key]
								this.setLocation(hash);
								break
							case 'filename':
								if (artifact.info['extra-info'][key] !== "none")
									tmpFiles.push({fname: artifact.info['extra-info'][key]})
								break
							case 'posterFrame':
								tmpFiles.push({
									fname: artifact.info['extra-info'][key],
									type: "Image",
									subtype: "Thumbnail"
								})
								break
							case 'runtime':
								this.setDetail("duration", artifact.info['extra-info'][key]);
								break
							case 'files':
								let fileList = artifact.info['extra-info'][key];

								for (let file of fileList) {
									this.addFile(file);
								}

								if (this.FileObjects.length > 0)
									hadFiles = true;
								break
							default:
								this.setDetail(key, artifact.info['extra-info'][key])
						}
					}
				}
				if (!hadFiles) {
					for (let file of tmpFiles) {
						this.addFile(file);
					}
				}
			}
		}
		if (artifact.payment) { //toDo
			// if (artifact.payment.type && artifact.payment.type === "tip"){
			// 	this.setPaymentFiat(artifact.payment.fiat);
			// }
			// if (artifact.payment.scale){
			// 	this.setPaymentScale(artifact.payment.scale);
			// }
			// if (artifact.payment.sugTip){
			// 	this.setSuggestedTip(artifact.payment.sugTip)
			// }
		}
	}

	/**
	 * Hydrate an oip041 JSON object
	 * @param artifact
	 */
	Artifact.prototype.import041 = function (artifact) {
		if (artifact.publisher) {
			this.setMainAddress(artifact.publisher)
		}
		if (artifact.timestamp) {
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type) {
			if (artifact.type.split("-").length === 2) {
				let type = artifact.type.split("-")[0];
				let subtype = artifact.type.split("-")[1];

				this.setType(type);
				this.setSubtype(subtype);
			} else if (artifact.type.split("-").length === 1) {
				this.setType(artifact.type)
			}
		}
		if (artifact.info) {
			if (artifact.info.title) {
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description) {
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year) {
				this.setYear(artifact.info.year)
			}
			if (artifact.info.tags) {
				this.setTags(artifact.info.tags)
			}
			if (artifact.info.nsfw) {
				this.setNSFW(artifact.info.nsfw)
			}

			if (artifact.info.extraInfo) {
				for (let key in artifact.info.extraInfo) {
					if (artifact.info.extraInfo.hasOwnProperty(key)) {
						this.setDetail(key, artifact.info.extraInfo[key]);
					}
				}
			}
		}

		if (artifact.storage) {
			if (artifact.storage.network) {
				this.setNetwork(artifact.storage.network);
			}
			if (artifact.storage.location) {
				this.setLocation(artifact.storage.location);
			}
			if (artifact.storage.files) {
				for (let file of artifact.storage.files) {
					this.addFile(file);
				}
			}
		}

		if (artifact.payment) {
			if (artifact.payment.fiat) {
				this.setPaymentFiat(artifact.payment.fiat);
			}
			if (artifact.payment.scale) {
				this.setPaymentScale(artifact.payment.scale);
			}
			if (artifact.payment.sugTip) {
				this.setSuggestedTip(artifact.payment.sugTip)
			}
			if (artifact.payment.tokens && Array.isArray(artifact.payment.tokens)) {
				for (let token of artifact.payment.tokens) {
					this.addTokenRule(token)
				}
			}
			if (artifact.payment.addresses) {
				for (let address of artifact.payment.addresses) {
					this.addSinglePaymentAddress(address.token, address.address)
				}
			}
			if (artifact.payment.retailer) {
				this.setRetailerCut(artifact.payment.retailer)
			}
			if (artifact.payment.promoter) {
				this.setPromoterCut(artifact.payment.promoter)
			}
			if (artifact.payment.maxdisc) {
				this.setMaxDiscount(artifact.payment.maxdisc)
			}
		}
	}

	/**
	 * Hydrate an oip042 JSON object
	 * @param artifact
	 */
	Artifact.prototype.import042 = function (artifact) {
		if (artifact.floAddress) {
			this.setMainAddress(artifact.floAddress)
		}
		if (artifact.timestamp) {
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type) {
			this.setType(artifact.type)
		}
		if (artifact.subtype) {
			this.setSubtype(artifact.subtype)
		}
		if (artifact.signature) {
			this.setSignature(artifact.signature)
		}
		if (artifact.info) {
			if (artifact.info.title) {
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description) {
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year) {
				this.setYear(artifact.info.year)
			}
			if (artifact.info.tags) {
				this.setTags(artifact.info.tags)
			}
			if (artifact.info.nsfw) {
				this.setNSFW(artifact.info.nsfw)
			}
		}

		if (artifact.details) {
			for (let key in artifact.details) {
				if (artifact.details.hasOwnProperty(key)) {
					this.setDetail(key, artifact.details[key]);
				}
			}
		}

		if (artifact.storage) {
			if (artifact.storage.network) {
				this.setNetwork(artifact.storage.network);
			}
			if (artifact.storage.location) {
				this.setLocation(artifact.storage.location);
			}
			if (artifact.storage.files) {
				for (let file of artifact.storage.files) {
					this.addFile(file);
				}
			}
		}

		if (artifact.payment) {
			if (artifact.payment.fiat) {
				this.setPaymentFiat(artifact.payment.fiat);
			}
			if (artifact.payment.scale) {
				this.setPaymentScale(artifact.payment.scale);
			}
			if (artifact.payment.sugTip) {
				this.setSuggestedTip(artifact.payment.sugTip)
			}
			if (artifact.payment.tokens && Array.isArray(artifact.payment.tokens)) {
				for (let token of artifact.payment.tokens) {
					this.addTokenRule(token)
				}
			}
			if (artifact.payment.addresses) {
				for (let coin in artifact.payment.addresses) {
					this.addSinglePaymentAddress(coin, artifact.payment.addresses[coin])
				}
			}
			if (artifact.payment.retailer) {
				this.setRetailerCut(artifact.payment.retailer)
			}
			if (artifact.payment.promoter) {
				this.setPromoterCut(artifact.payment.promoter)
			}
			if (artifact.payment.maxdisc) {
				this.setMaxDiscount(artifact.payment.maxdisc)
			}
		}
	}

	/**
	 * Get the Multiparts that make up the Artifact
	 * @return {Array.<Multipart>} Returns undefined if the Artifact is too short to be a Multipart
	 */
	Artifact.prototype.getMultiparts = function () {
		let jsonString = this.toString();

		if (jsonString.length > FLODATA_MAX_LEN || this.fromMultipart) {
			let exactMatch = false;

			let oldArtifact = new Artifact();
			oldArtifact.fromMultiparts(this.Multiparts)

			if (oldArtifact.toString() === jsonString)
				exactMatch = true;

			if (!exactMatch) {
				this.Multiparts = [];

				let chunks = [];
				while (jsonString.length > CHOP_MAX_LEN) {
					chunks[chunks.length] = jsonString.slice(0, CHOP_MAX_LEN);
					jsonString = jsonString.slice(CHOP_MAX_LEN);
				}
				chunks[chunks.length] = jsonString;

				for (let c in chunks) {
					let mp = new Multipart();

					mp.setPartNumber(parseInt(c));
					mp.setTotalParts(chunks.length - 1);
					mp.setPublisherAddress(this.getMainAddress());
					mp.setChoppedStringData(chunks[c]);
					mp.is_valid = mp.isValid().success;

					// If we are the first multipart, then sign ourself
					if (c == 0) {
						mp.is_first_part = true;
						if (c.indexOf("oip042") !== 0) {
							mp.hasJSONPrefix = true
						}
						// @TODO: Implement multipart signing
						// mp.sign();
					}

					this.Multiparts.push(mp);
				}
			}

			return this.Multiparts;
		} else {
			// Too short to be a multipart!
			return;
		}
	}

	Artifact.prototype.fromMultiparts = function (multipartArray) {
		if (Array.isArray(multipartArray)) {
			for (let part in multipartArray) {
				if (multipartArray[part] instanceof Multipart) {
					this.Multiparts[part] = multipartArray[part];
				} else {
					let mp = new Multipart();
					mp.fromString(multipartArray[part]);
					this.Multiparts.push(mp);
				}
			}

			if (Array.isArray(this.Multiparts)) {
				this.Multiparts.sort(function (a, b) {
					return a.getPartNumber() - b.getPartNumber()
				})
			}

			let jsonString = "";

			for (let multiP of this.Multiparts) {
				jsonString += multiP.getChoppedStringData();
			}

			try {
				this.fromJSON(JSON.parse(jsonString))
				if (this.Multiparts[0] && this.Multiparts[0].getTXID() !== "") {
					this.setTXID(this.Multiparts[0].getTXID())
				}
				this.fromMultipart = true;
			} catch (e) {
				return {success: false, message: "Unable to parse from JSON!", error: e}
			}
		} else {
			return {success: false, message: "You must pass an array!"}
		}
	}

	Artifact.prototype.capitalizeFirstLetter = function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}

	/**
	 * Get the Class Name.
	 * This is used to check the passed object in ArtifactFile (since InstanceOf could not be done).
	 * @return {string} Returns "Artifact"
	 */
	Artifact.prototype.getClassName = function () {
		return "Artifact"
	}

	//constructor
	if (input) {
		if (typeof input === "string") {
			if (input.startsWith("json:")) {
				input = input.slice(5)
			}
			try {
				this.fromJSON(JSON.parse(input))
			} catch (e) {console.error('Error parsing input in Artifact constructor', e)}
		} else if (typeof input === "object") {
			this.fromJSON(input)
		}
	}
}