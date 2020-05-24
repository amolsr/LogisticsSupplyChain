
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const args = require('yargs').argv

const ccpPath = path.resolve(__dirname, '..', 'connection-' + args.org + '.json');

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1_' + args.org);
        if (userExists) {
            console.log('An identity for the user user1_' + args.org + ' already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin_' + args.org);
        if (!adminExists) {
            console.log('An identity for the admin user admin_' + args.org + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin_' + args.org, discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: args.org + '.department1', enrollmentID: 'user1_' + args.org, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: 'user1_' + args.org, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity(args.org.charAt(0).toUpperCase() + args.org.slice(1) + 'MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('user1_' + args.org, userIdentity);
        console.log('Successfully registered and enrolled admin user_' + args.org + ' and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user_` + args.org + `:  ${error}`);
        process.exit(1);
    }
}

main();