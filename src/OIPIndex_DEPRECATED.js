import axios from 'axios';
import Artifact from './Artifacts/Artifact_DEPRECATED';
import Multipart from './OIPComponents/Multipart'


const defaultOIPdURL = "https://usul.3drm.io/alexandria/v2";
class Index {
	constructor(settings){
		if (settings && settings.OIPdURL) {
			this.setOIPdURL(settings.OIPdURL)
		} else this.setOIPdURL(defaultOIPdURL)
	}

	setOIPdURL(OIPdURL){
		this.url = OIPdURL;

		this.network = new axios.create({
			baseURL: this.url
		})
	}

	getOIPdURL() {
		return this.url
	}

	getNetwork() {
		return this.network
	}

	/**
	 * Search The Index
	 * @param  {string}  searchFor  - The string you wish to search for in the Index
	 * @param  {String}  [searchOn="*"] - The "node" you wish to search on
	 * @param  {Boolean} [searchLike=true] - Should we search similar (like) values, or only exact values
	 * @param  {String}  [protocol="media"] - Which type we wish to get back
	 * @return {Promise<Artifact|Publisher|Platform|Influencer|Autominer|AutominerPool>} Returns a Promise that will resolve to the hydrated object or reject on error
	 */

	//@ToDo::Convert to Elastic Search later
	async search(searchFor, searchOn = "*", searchLike = true, protocol = "media"){
		if (!searchFor)
			throw new Error("searchFor is a required parameter!")

		var options = {
			searchFor,
			searchOn,
			searchLike,
			protocol
		}

		var response = await this.network.post("/search", options)

		return response.data
	}

	//@ToDo::----------------Publishers and Artifacts-----------------------------------------------

	/**
	 * Get a specific Artifact from the Index (if searching on multipart, txid must be of the first multipart)
	 * @param  {TXID} txid - The TXID of the Artifact you wish to get
	 * @return {Promise<Artifact> | Promise<Object>} Returns a Promise that will resolve to an Artifact or an object containing an error
	 */
	async getArtifact(txid){
		try {
			let response = await this.network.get(`/artifact/get?id=${txid}`, {});
			if (response && response.data) {
				let tmpArt = new Artifact(response.data);
				if (tmpArt.isValid().success)
					return tmpArt
			}
		} catch (err) {
			let error = {};
			if (err.response && err.response.data) {
				error.error = err.response.data || 'error';
				error.status = `${err.response.status} ${err.response.statusText}` || 'status unknown';
			} else {
				error.error = "Error fetching artifact: could not get err response data"
			}
			return error;
		}
	}

	/**
	 * Get the Latest Artifacts published to the Index
	 * @param  {number} [amount=50] - The amount of Artifacts you wish to receive
	 * @return {Promise<Array.<Artifact>>} Returns a Promise that will resolve to an Array of Artifacts
	 */
	async getLatestArtifacts(amount = 50){
		try {
			return await this.getArtifacts(null, null, amount, null, null);
		} catch (err) {console.error(err)}
	}

	/**
	 * Get the latest Artifacts from the Index
	 * @param  {string} [type] - [The type of artifacts you wish to receive]
	 * @param  {string} [subtype] - [The subtype of artifacts you wish to receive]
	 * @param  {number} [numResults=100] - [The number of artifacts you wish to get back]
	 * @param  {number} [page=1] - [Which 'page' you wish to search on (a page contains 50 or so Artifacts)]
	 * @param {string} [publisher]  - []
	 * @return {Promise<Array.<Artifact>>} Returns a Promise that will resolve to an Array of Artifacts
	 */
	async getArtifacts(type, subtype, numResults, page, publisher){
		let p = page;
		let nr = numResults || 50;
		let t = type || "*";
		if (typeof t === "string") t = t.toLowerCase();
		let st = subtype || "*";
		if (typeof t === "string") st = st.toLowerCase();
		let pub = publisher || "";


		if (page && isNaN(page) && page !== "*"){
			p = 1;
		} else if (page === "*") {
			nr = "*";
			p = 1;
		}

		try {
			let response = await this.network.get(`/artifact/get/type?t=${t}&st=${st}&results=${nr}&page=${p}&pub=${pub}`);
			let artifacts = [];
			if (response && response.data && response.data.results) {
				for (let art of response.data.results) {
					let tmpArt = new Artifact(art);
					if (tmpArt.isValid().success)
						artifacts.push(tmpArt)
				}
			}
			return artifacts
		} catch (err) {return err}
	}

	/**
	 * Get a specific Publisher from the Index
	 * @param  {TXID} txid - The TXID of the Publisher you wish to get
	 * @return {Promise<Publisher>} Returns a Promise that will resolve to an Publisher or reject with an error
	 */
	async getPublisher(){
		//@ToDo::add working API endpoint
		try {
			let response =  await this.network.get(`/artifact/get/publisher`).data;
			return response.data
		}catch (err) {return err}
	}

	/**
	 * Get a all Publishers from Index
	 * @return {} []
	 */
	async getAllPublishers() {
		//@ToDo::add working API endpoint
		try {
			let response = await this.network.get(`/publisher/get/all`);
			return response.data
		}catch (err) {return err}
	}

	//@ToDo::----------------Influencers and Platforms----------------------------------------------

	/**
	 * Get a specific Platform from the Index
	 * @param  {TXID} txid - The TXID of the Platform you wish to get
	 * @return {Promise<Platform>} Returns a Promise that will resolve to an Platform or reject with an error
	 */
	async getPlatform(txid){
		//@ToDo::add working API endpoint
	}

	/**
	 * Get all Platformss from the Index
	 * @return {Promise<Platforms>} []
	 */
	async getAllPlatforms(){
		//@ToDo::add working API endpoint
		try {
			return await this.network.get(`/retailer/get/all`)
		}catch (err) {return err}
	}

	/**
	 * Get a specific Influencer from the Index
	 * @param  {TXID} txid - The TXID of the Influencer you wish to get
	 * @return {Promise<Influencer>} Returns a Promise that will resolve to an Influencer or reject with an error
	 */
	async getInfluencer(txid){
		//@ToDo::add working API endpoint
	}

	/**
	 * Get a all Influencers from the Index
	 * @return {Promise<Influencer>} []
	 */
	async getAllInfluencers(){
		//@ToDo::add working API endpoint
		try {
			return await this.network.get(`/promoter/get/all`)
		}catch (err) {return err}
	}

	//@ToDo::----------------Autominers and Pools---------------------------------------------------

	/**
	 * Get a specific Autominer from the Index
	 * @param  {TXID} txid - The TXID of the Autominer you wish to get
	 * @return {Promise<Autominer>} Returns a Promise that will resolve to an Autominer or reject with an error
	 */
	async getAutominer(txid){
		//@ToDo::add working API endpoint
	}

	/**
	 * Get a all Autominers from the Index
	 * @return {Promise<Autominer>} Returns a Promise that will resolve to an Autominer or reject with an error
	 */
	async getAllAutominers(){
		//@ToDo::add working API endpoint
		try {
			return await this.network.get(`/autominer/get/all`)
		}catch (err) {return err}
	}

	/**
	 * Get a specific AutominerPool from the Index
	 * @param  {TXID} txid - The TXID of the AutominerPool you wish to get
	 * @return {Promise<AutominerPool>} Returns a Promise that will resolve to an AutominerPool or reject with an error
	 */
	async getAutominerPool(txid){
		//@ToDo::add working API endpoint
	}

	/**
	 * Get a all Autominers from the Index
	 * @return {Promise<Autominer>} Returns a Promise that will resolve to an Autominer or reject with an error
	 */
	async getAllAutominerPools(){
		//@ToDo::add working API endpoint
		try {
			return await this.network.get(`/autominerpool/get/all`)
		}catch (err) {return err}
	}

	//@ToDo::----------------Flo Data and Multipart-------------------------------------------------

	/**
	 * Get a the floData of a specific Transaction
	 * @param  {TXID} txid - The TXID you wish to get the floData of
	 * @return {Promise<String>} Returns a Promise that will resolve to a floData string or reject with an error
	 */
	async getFloData(txid){
		try {
			let response = await axios.get(`https://livenet.flocha.in/api/tx/${txid}`)
			return response.data.floData
		} catch (err) {
			let error = {};
			if (err.message) {error.message = err.message}
			if (error.response && error.response.data) {
				error.error = err.response.data || 'error';
				error.status = `${err.response.status} ${err.response.statusText}` || 'status unknown';
			}
			return error;
		}
	}

	/**
	 * Search all the floData published into the Flo Blockchain, this is provided by a connection to an OIPd server
	 * @param  {Object|string} options - [the string you wish to search or an object with 'search' and/or 'page' properties]
	 * @return {Promise<Array.<Object>>} Returns a Promise that will resolve to an Array of objects containing the transaction hash and message matched
	 */
	async searchFloData(options){
		if (!options)
			throw new Error("Must provide a string or object")

		if (typeof options === "string"){
			options = {
				search: options
			}
		}

		if (!options.page)
			options.page = 0;

		if (!options["results-per-page"])
			options["results-per-page"] = 30;
		try {
			let response = await this.network.post(`/searchTxComment`, options)
			return response.data
		} catch (err) {return err}
	}

	/**
	 * Build and get the multiparts
	 * @param  {string} txid - The TXID of a valid oip-multipart
	 * @return {Promise<Array.<Multipart>|Artifact>} Returns a Promise that will resolve to an Array of Multiparts, or a single Artifact if it is not Multiparts
	 */
	async getMultiparts(txid){
		if (!txid || typeof txid !== "string" || txid.length === 0)
			throw new Error("You must input a search txid!");

		//@ToDO::   Step 1 - Get Artifact to set TXID
		let artifact;
		try {
			artifact = await this.getArtifact(txid);
		} catch (err) {console.error(err)}

		let reqFloDataTXID = txid;
		if (!artifact.error) {
			if (txid && artifact && artifact.txid) {
				if (txid.length <= 5) {
					txid = artifact.txid;
				}
				reqFloDataTXID = artifact.txid;
			}
		}

		//@ToDO::   Step 2 - Get FloData with TXID
		let floData;
		try {
			floData = await this.getFloData(reqFloDataTXID);
		} catch (err) {throw new Error(`Couldn't get floData to hydrate multipart: ${err}`)}

		//@ToDO::   Step 3 - Create FirstMP with FloData from step 2
		let results, matched = [], existingParts = [];

		let firstMp = new Multipart(floData, reqFloDataTXID);
		if (firstMp.is_valid) {
			matched.push(firstMp)
			existingParts.push(firstMp.getPartNumber())
		} else {
			throw firstMp.invalid_error || firstMp.isValid().message
		}

		let firstPartTXID = txid;
		if (!firstMp.is_first_part) {
			firstPartTXID = firstMp.getFirstPartTXID()
			try {
				let artifact = await this.getArtifact(firstPartTXID.substr(0,10))
				let floData = await this.getFloData(artifact.txid)
			} catch (err) {console.error(err)}
			let tmpMp = new Multipart(floData, artifact.txid);
			if (tmpMp.is_valid) {
				matched.push(tmpMp)
				existingParts.push(tmpMp.getPartNumber())
			} else {throw new Error(`First multipart is not a valid multipart: ${tmpMp.isValid().message}`)}
		}

		//@ToDO::   Step 5 - Get the rest of the MPs
		let searchFloTXID = (firstPartTXID.length > 10) ? firstPartTXID.substr(0,10) : firstPartTXID

		let searchOps = {
			search: searchFloTXID,
			page: 0
		}

		async function findRemainingMultiparts(searchOps, _this) {
			try {
				results = await _this.searchFloData(searchOps);
				if (results === null) {
					return null
				}
			} catch (err) {console.error(err); return null}

			if (results) {
				for (let mp of results) {
					let tmpMp = new Multipart(mp.Message, mp.Hash);

					let trimLength = firstPartTXID.length
					// Take whichever is shorter

					if (tmpMp.getFirstPartTXID().length < trimLength && tmpMp.getFirstPartTXID().length > 0) {
						trimLength = tmpMp.getFirstPartTXID().length
					}

					if (firstPartTXID.substr(0, trimLength) === tmpMp.getFirstPartTXID().substr(0, trimLength)) {
						if (!existingParts.includes(tmpMp.getPartNumber())) {
							matched.push(tmpMp)
							existingParts.push(tmpMp.getPartNumber())
						}
					}
				}
				results = [];
			}
		}

		while (matched.length - 1 < firstMp.getTotalParts()) {
			const _this = this;
			let stop = await findRemainingMultiparts(searchOps, _this)

			if ((matched.length - 1 === firstMp.getTotalParts()) || stop === null) {
				let ret = new Array(firstMp.getTotalParts()+1)
				for (let i = 0; i < matched.length; i++) {
					ret[matched[i].getPartNumber()] = matched[i]
				}
				return ret
			}
			searchOps.page++
		}
	}
}

module.exports = Index;