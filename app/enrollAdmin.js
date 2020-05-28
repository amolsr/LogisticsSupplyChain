
const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const args = require('yargs').argv

const ccpPath = path.resolve(__dirname, '..', 'connection-profile', args.org + '.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.' + args.org + '.example.com'];
        const ca = new FabricCAServices(caInfo.url);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin_' + args.org);
        if (adminExists) {
            console.log('An identity for the admin user admin_' + args.org + ' already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin_' + args.org, enrollmentSecret: 'adminpw' });
        const identity = X509WalletMixin.createIdentity(args.org.charAt(0).toUpperCase() + args.org.slice(1) + 'MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('admin_' + args.org, identity);
        console.log('Successfully enrolled admin user admin_' + args.org + ' and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user admin_` + args.org + `: ${error}`);
        process.exit(1);
    }
}

main();