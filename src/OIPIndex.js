import axios from 'axios';
import MPSingle from './OIPComponents/MPSingle'
import FloDataTX from './OIPComponents/FloDataTX'
import Artifact from './Artifacts/Artifact'

/**
 * The Transaction ID on the Blockchain.
 * @typedef {string} TXID
 * @example <caption>Full TXID Reference</caption>
 * 8a83ecb7812ca2770814d996529e153b07b103424cd389b800b743baa9604c5b
 * @example <caption>Shortened TXID Reference</caption>
 * 8a83ec
 */

const hydrateArray = (artifacts) => {
	let tmpArray = []
	for (let art of artifacts) {
		tmpArray.push(Artifact(art))
	}
	return tmpArray
}

const hydrateFloDataTX = (floDataTXs) => {
	let tmpArray = []
	for (let data of floDataTXs) {
		tmpArray.push(new FloDataTX(data))
	}
	return tmpArray
}
	//ToDo: change to 'https' when ready
const localhost = "http://localhost:1606"
const defaultOIPdURL = "http://usul.3drm.io:1606";

class OIPIndex {
	/**
	 * Spawn a new OIP Index with a specific OIPd URL
	 * @param  {Object} [settings] - The Settings to use for the Index
	 * @param {string} [settings.OIPdURL="https://snowflake.oip.fun/alexandria/v2"] [description]
	 * @return {Index}
	 */
	constructor(settings) {
		if (settings && settings.OIPdURL) {
			this.setOIPdURL(settings.OIPdURL)
			//ToDo: switch back to defaultOIPdURL
		} else this.setOIPdURL(defaultOIPdURL)
	}

	setOIPdURL(OIPdURL) {
		this.url = OIPdURL;

		this.index = new axios.create({
			baseURL: this.url,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
	}

	getOIPdURL() {
		return this.url
	}

	getNetwork() {
		return this.index
	}

	/**
	 * Search The Index for Artifacts that match your search query
	 * @param {string} query - your search query
	 * @param {number} [limit=100] - max num of results
	 * @return {Promise<Object>}
	 * //return example
	 * {success: true, artifacts: artifacts, ...}
	 *
	 * //or error
	 * {success: false, error: error, ...}
	 */
	async searchArtifacts(query, limit) {
		if (typeof query !== 'string') {
			return {success: false, error: `'query' must be of type string`}
		}
		let res;
		try {
			res = await this.index.get(`/artifact/search`, {
				params: {
					q: query
				},
				limit
			})
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let artifacts = res.data.results
			if (artifacts.length === 0)
				return {success: true, message: `No artifacts found with query: ${query}`, artifacts}
			return {success: true, artifacts: hydrateArray(artifacts)}
		} else {
			return {success: false, error: 'No data returned from axios request', response: res.data}
		}
	}

	/**
	 * Get an Artifact from the Index by TXID
	 * @param {string} txid  - transaction id of the artifact you wish to retrieve
	 * @return {Promise<Object>} Returns a Promise that will resolve to an Artifact or an object containing an error
	 * @example
	 * //return example
	 * {success: true, artifact: Artifact}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getArtifact(txid) {
		let res
		try {
			res = await this.index.get(`/artifact/get/${txid}`);
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let resultArray = res.data.results

			if (resultArray.length === 0) {
				return {success: false, error: "No results found", response: res.data}
			} else if (resultArray.length > 1) {
				return {success: false, error: "Multiple artifacts found, possible collision", artifacts: resultArray}
			} else return {success: true, artifact: Artifact(resultArray[0])}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res.data}
		}
	}

	/**
	 * Get multiple Artifacts by their TXID
	 * @param {Array.<string>} txids - an array of transaction IDs
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: artifacts>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getArtifacts(txids) {
		if (!Array.isArray(txids)) {
			return {success: false, error: `'txids' must be an Array of transaction IDs`}
		}
		let artifacts = []
		let errors = []
		for (let txid of txids) {
			let res
			try {
				res = await this.getArtifact(txid)
			} catch (err) {
				return {success: false, error: err}
			}
			if (res.success) artifacts.push(res.artifact)
			else errors.push(res.artifact)
		}
		if (errors.length > 0) {
			return {success: false, error: 'Not [all artifacts] found', errors, artifacts}
		} else {
			return {success: true, artifacts: artifacts}
		}
	}

	/**
	 * Get the Latest Artifacts published to the Index
	 * @param {number} [limit=100] - The amount of artifacts you want returns ( max: 1000 )
	 * @param {boolean} [nsfw=false] - not safe for work artifacts (don't be sick!)
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: Array.<Artifact>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getLatestArtifacts(limit = 100, nsfw = false) {
		let res
		try {
			res = await this.index.get(`/artifact/get/latest/${limit}`, {
				params: {
					nsfw
				}
			});
		} catch (err) {
			return {success: false, error: err}
		}

		if (res && res.data) {
			let artifacts = res.data.results
			if (artifacts.length === 0)
				return {success: false, error: 'No artifacts found', response: res.data}
			if (artifacts.length > 0 && artifacts.length < limit)
				return {success: true, artifacts: hydrateArray(artifacts), message: 'Not all requested artifacts were found'}
			if (artifacts.length === limit)
				return {success: true, artifacts: hydrateArray(artifacts)}
		} else {
			return {success: false, error: 'No data returned from axios request', response: res.data}
		}
	}

	/**
	 * Get the Latest OIP041 Artifacts published to the Index
	 * @param {number} [limit=100] - The amount of artifacts you want returns ( max: 1000 )
	 * @param {boolean} [nsfw=false] - not safe for work artifacts (don't be sick!)
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: Array.<Artifact>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getLatest041Artifacts(limit = 100, nsfw = false) {
		let res
		try {
			res = await this.index.get(`/oip041/artifact/get/latest/${limit}`, {
				params: {
					nsfw
				}
			});
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let artifacts = res.data.results
			if (artifacts.length === 0)
				return {success: false, error: 'No artifacts found', response: res.data}
			if (artifacts.length > 0 && artifacts.length < limit)
				return {success: true, artifacts: hydrateArray(artifacts), warning: 'Not all requested artifacts were found'}
			if (artifacts.length === limit) {
				return {success: true, artifacts: hydrateArray(artifacts)}
			}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res}
		}
	}

	/**
	 * Get an OIP041 Artifact from the Index by TXID
	 * @param {string} txid  - transaction id of the artifact you wish to retrieve
	 * @return {Promise<Object>} Returns a Promise that will resolve to an Artifact or an object containing an error
	 * @example
	 * //return example
	 * {success: true, artifact: Artifact}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async get041Artifact(txid) {
		let res
		try {
			res = await this.index.get(`/oip041/artifact/get/${txid}`);
		} catch (err) {
			return {success: false, error: err}
		}

		if (res && res.data) {
			let resultArray = res.data.results

			if (resultArray.length === 0) {
				return {success: false, error: "No results found", response: res.data}
			} else if (resultArray.length > 1) {
				return {success: false, error: "Multiple artifacts found, possible collision", artifacts: resultArray}
			} else return {success: true, artifact: Artifact(resultArray[0])}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res.data}
		}
	}

	/**
	 * Get multiple OIP041 Artifacts by their TXID
	 * @param {Array.<string>} txids - an array of transaction IDs
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: artifacts>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async get041Artifacts(txids) {
		if (!Array.isArray(txids)) {
			return {success: false, error: `'txids' must be an Array of transaction IDs`}
		}
		let artifacts = []
		let errors = []
		for (let txid of txids) {
			let res
			try {
				res = await this.get041Artifact(txid)
			} catch (err) {
				return {success: false, error: err}
			}
			if (res.success) artifacts.push(res.artifact)
			else errors.push(res.artifact)
		}
		if (errors.length > 0) {
			return {success: false, error: 'Not [all artifacts] found', errors, artifacts}
		} else {
			return {success: true, artifacts: artifacts}
		}
	}

	/**
	 * Get the Latest OIP042 Artifacts published to the Index
	 * @param {number} [limit=100] - The amount of artifacts you want returns ( max: 1000 )
	 * @param {boolean} [nsfw=false] - not safe for work artifacts (don't be sick!)
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: Array.<Artifact>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getLatest042Artifacts(limit = 100 , nsfw = false) {
		let res
		try {
			res = await this.index.get(`/oip042/artifact/get/latest/${limit}`, {
				params: {
					nsfw
				}
			});
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let artifacts = res.data.results
			if (artifacts.length === 0)
				return {success: false, error: 'No artifacts found', response: res.data}
			if (artifacts.length > 0 && artifacts.length < limit)
				return {success: true, artifacts: hydrateArray(artifacts), warning: 'Not all requested artifacts were found'}
			if (artifacts.length === limit) {
				return {success: true, artifacts: hydrateArray(artifacts)}
			}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res}
		}
	}

	/**
	 * Get the Latest Alexandria Media Artifacts published to the Index
	 * @param {number} [limit=100] - The amount of artifacts you want returns ( max: 1000 )
	 * @param {boolean} [nsfw=false] - not safe for work artifacts (don't be sick!)
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: Array.<Artifact>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getLatestAlexandriaMediaArtifacts(limit = 100, nsfw = false) {
		let res
		try {
			res = await this.index.get(`/alexandria/artifact/get/latest/${limit}`, {
				params: {
					nsfw
				}
			});
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let artifacts = res.data.results
			if (artifacts.length === 0)
				return {success: false, error: 'No artifacts found', response: res.data}
			if (artifacts.length > 0 && artifacts.length < limit)
				return {success: true, artifacts: hydrateArray(artifacts), warning: 'Not all requested artifacts were found'}
			if (artifacts.length === limit) {
				return {success: true, artifacts: hydrateArray(artifacts)}
			}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res}
		}
	}

	/**
	 * Get an Alexandria Media Artifact from the Index by TXID
	 * @param {string} txid  - transaction id of the artifact you wish to retrieve
	 * @return {Promise<Object>} Returns a Promise that will resolve to an Artifact or an object containing an error
	 * @example
	 * //return example
	 * {success: true, artifact: Artifact}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getAlexandriaMediaArtifact(txid) {
		let res
		try {
			res = await this.index.get(`/alexandria/artifact/get/${txid}`);
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let resultArray = res.data.results

			if (resultArray.length === 0) {
				return {success: false, error: "No results found", response: res.data}
			} else if (resultArray.length > 1) {
				return {success: false, error: "Multiple artifacts found, possible collision", artifacts: resultArray}
			} else return {success: true, artifact: Artifact(resultArray[0])}

		} else {
			return {success: false, error: 'No data returned from axios request', response: res.data}
		}
	}

	/**
	 * Get one or more Alexandria Media Artifacts by their TXID
	 * @param {Array.<string>} txids - an array of transaction IDs
	 * @return {Promise<Object>}
	 * @example
	 * //return example
	 * {success: true, artifacts: artifacts}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async getAlexandriaMediaArtifacts(txids) {
		if (!Array.isArray(txids)) {
			return {success: false, error: `'txids' must be an Array of transaction IDs`}
		}
		let artifacts = []
		let errors = []
		for (let txid of txids) {
			let res
			try {
				res = await this.getAlexandriaMediaArtifact(txid)
			} catch (err) {
				return {success: false, error: err}
			}
			if (res.success) artifacts.push(res.artifact)
			else errors.push(res.artifact)
		}
		if (errors.length > 0) {
			return {success: false, error: 'Not [all artifacts] found', errors, artifacts}
		} else {
			return {success: true, artifacts: artifacts}
		}
	}

	/**
	 * Search all the floData published into the Flo Blockchain, this is provided by a connection to an OIPd server
	 * @param {string} query - your search query
	 * @param {number} [limit] - max num of results
	 * @return {Promise<Object>}
	 * //return example
	 * {success: true, floData: Array.<FloDataTXs>}
	 *
	 * //or error
	 * {success: false, error: error}
	 */
	async searchFloData(query, limit) {
		if (typeof query !== 'string') {
			return {success: false, error: `'query' must be of type string`}
		}
		let res;
		try {
			res = await this.index.get(`/floData/search`, {
				params: {
					q: query
				},
				limit
			})
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let txs = res.data.results
			//ToDo: consider not initializing a class for tx data
			return {success: true, txs: hydrateFloDataTX(txs)}
		} else {
			return {success: false, error: 'Missing axios data response', response: res.data}
		}
	}

	/**
	 * Get floData by TXID
	 * @param {string} txid - the transaction id you wish to grab the floData from
	 */
	async getFloData(txid) {
		let res;
		try {
			res = await this.index.get(`/floData/get/${txid}`)
		} catch (err) {
			return {sucess: false, error: err}
		}
		if (res && res.data) {
			let results = res.data.results
			if (results.length === 0) {
				return {success: false, error: 'No floData found', response: res.data}
			} else if (results.length > 1) {
				return {success: false, error: 'Collision: multiple data points found', response: res.data}
			} else {
				return {success: true, floData: res.data.results[0].tx.floData}
			}
		} else {
			return {success: false, error: 'Missing data', response: res.data}
		}

	}

	/**
	 * Get a Multipart by its TXID
	 * @param txid
	 * @return {Promise<Object>}
	 */
	async getMultipart(txid) {
		let res;
		try {
			res = await this.index.get(`/multipart/get/id/${txid}`)
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let total = res.data.total
			let results = res.data.results
			let multiparts = []
			for (let mp of results) {
				multiparts.push(new MPSingle(mp))
			}
			if (!total) {
				return {success: false, message: "No parts found", responseData: res.data}
			} else if (total > 1) {
				return {success: false, message: "Collision: mulitple parts found with single ID", multiparts}
			} else {
				return {success: true, multipart: multiparts[0]}
			}
		} else {
			return {success: false, error: "Missing axios data response", response: res}
		}

	}

	/**
	 * Get OIP Multiparts by the First TXID Reference
	 * @param {string} ref - the TXID reference of the first multipart
	 * @param {number} [limit] - max num of results
	 * @return {Promise<Object>}
	 */
	async getMultiparts(ref, limit) {
		let res;
		let querystring = `/multipart/get/ref/${ref}`
		if (limit) querystring += `/${limit}`
		try {
			res = await this.index.get(querystring)
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let total = res.data.total
			let results = res.data.results
			let multiparts = []
			for (let mp of results) {
				multiparts.push(new MPSingle(mp))
			}
			return {success: true, multiparts, total}

		} else {
			return {success: false, error: "Missing axios data response", response: res}
		}

	}

	/**
	 * Get a historian data point by its txid
	 * @param {string} txid
	 * @return {Promise<Object>}
	 */
	async getHistorianData(txid) {
		let res
		try {
			res = await this.index.get(`historian/get/${txid}`)
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let result = res.data.results
			if (Array.isArray(result)) {
				if (result.length === 1) {
					result = result[0]
				}
				return {success: true, result}
			}
		} else {
			return {success: false, response: res.data, error: "No data returned from axios request"}
		}
	}

	/**
	 * Get the latest historian data points
	 * @param {number} [limit=100]
	 * @return {Promise<{Object}>}
	 */
	async getLastestHistorianData(limit = 100) {
		let res
		try {
			res = await this.index.get(`historian/get/latest/${limit}`)
		} catch (err) {
			return {success: false, error: err}
		}
		if (res && res.data) {
			let results = res.data.results
			return {success: true, results}
		} else {
			return {success: false, response: res.data, error: "No data returned from axios request"}
		}
	}

	/**
	 * Get OIP Daemon specs
	 * @return {Promise<Object>}
	 */
	async getVersion() {
		let res
		try {
			res = await this.index.get('/version')
		} catch (err) {
			return {success: false, error: "Missing axios data response", response: res}
		}
		return res.data
	}
}

export default OIPIndex;
