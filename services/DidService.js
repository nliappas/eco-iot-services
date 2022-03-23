class DidService {

	constructor() {
		this.did = null;
	}

	getUserDetails(callback) {
		const  fetch  = require("../utils/fetch");
		fetch('/api-standard/user-details')
			.then((response) => response.json())
			.then((userDetails) => {
				callback(null, userDetails);
			})
			.catch((err) => {
				console.log(`Failed to load user-details`, err);
				callback(err);
			});
	}

	async getWalletDomain() {
		const opendsu = require("opendsu");
		const config = opendsu.loadAPI("config");
		const defaultDomain = "default";
		try {
			let domain = await $$.promisify(config.getEnv)("domain");
			if (!domain) {
				domain = defaultDomain;
			}
			return domain;
		} catch (e) {
			return defaultDomain;
		}
	}

	async getDID(){
		return new Promise(async (resolve, reject) => {
			if(this.did){
				return resolve(this.did);
			}

			if(typeof window !== "undefined"){
				//in browser, e.g ssapps
				return this.getUserDetails(async (err, userDetails)=>{
					if(err){
						return reject(err);
					}

					const domain = await this.getWalletDomain();
					const did = `did:ssi:name:${domain}:${userDetails.username}`
					this.did = did;
					resolve(did);
				})
			}

			const opendsu = require("opendsu");
			const scAPI = opendsu.loadApi("sc");

			const mainDSU = await $$.promisify(scAPI.getMainDSU)();
			let environment = JSON.parse(await $$.promisify(mainDSU.readFile)("environment.json"));
			if(!environment.hasOwnProperty("did")){
				return reject("No did set in environment.js");
			}
			resolve(environment.did);

		});
	}

	static getDidData(didString){
		const splitDid = didString.split(":");
		return {
			didType: `${splitDid[1]}:${splitDid[2]}`,
			publicName: splitDid[4],
			domain:splitDid[3]
		};
	}
}


let instance = null;
const getDidServiceInstance = () => {
	if (instance === null) {
		instance = new DidService();
	}
	return instance;
};

module.exports = {
	getDidServiceInstance,
	getDidData:DidService.getDidData
};
