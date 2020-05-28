const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const args = require('yargs').argv
const { getHashOfFile } = require('./helper')

const ccpPath = path.resolve(__dirname, '..', 'connection-profile', args.org + '.json');

async function main() {
	try {

		// Create a new file system based wallet for managing identities.
		const walletPath = path.join(process.cwd(), 'wallet');
		const wallet = new FileSystemWallet(walletPath);
		console.log(`Wallet path: ${walletPath}`);

		// Check to see if we've already enrolled the user.
		const userExists = await wallet.exists('user1_' + args.org);
		if (!userExists) {
			console.log('An identity for the user "user1" does not exist in the wallet');
			console.log('Run the registerUser.js application before retrying');
			return;
		}

		// Create a new gateway for connecting to our peer node.
		const gateway = new Gateway();
		await gateway.connect(ccpPath, { wallet, identity: 'user1_' + args.org, discovery: { enabled: true, asLocalhost: true } });

		// Get the network (channel) our contract is deployed to.
		const network = await gateway.getNetwork('channel12');

		// Get the contract from the network.
		const contract = network.getContract('mycc');
		var hash = await getHashOfFile(args.filename)
		// Evaluate the specified transaction.
		// queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
		// queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
		const result = await contract.evaluateTransaction(args.fn, hash);
		console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

	} catch (error) {
		console.error(`Failed to evaluate transaction: ${error}`);
		process.exit(1);
	}
}

main();