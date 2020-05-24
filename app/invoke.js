const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const args = require('yargs').argv
const { getHashOfFile } = require('./helper')
var log4js = require('log4js');
var logger = log4js.getLogger('logistics');
logger.level = 'DEBUG';

var util = require('util')

const ccpPath = path.resolve(__dirname, '..', 'connection-' + args.org + '.json');

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        logger.debug(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1_' + args.org);
        if (!userExists) {
            logger.debug('An identity for the user "user1" does not exist in the wallet');
            logger.debug('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1_' + args.org, discovery: { enabled: true, asLocalhost: true } });


        // Get the network (channel) our contract is deployed to.
        await gateway.getNetwork('channel12');

        const client = gateway.getClient();

        const channel = client.getChannel('channel12');
        logger.debug('Got addressability to channel');
        //const channel_event_hub = channel.getChannelEventHub(peerAddr);
        var tx_id = client.newTransactionID();
        logger.debug("Assigning transaction_id: ", tx_id._transaction_id);
        var hash = await getHashOfFile(args.filename)
        var request = {
            chaincodeId: 'mycc',
            fcn: args.fn,
            args: [hash, args.to],
            chainId: channel,
            txId: tx_id,
            preferred: ['peer0', 'peer0.org2.example.com:9051'],
        };

        let results = await channel.sendTransactionProposal(request);

        var proposalResponses = results[0];
        var proposal = results[1];

        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
            isProposalGood = true;
            logger.debug('Transaction proposal was good');
        } else {
            logger.error('Transaction proposal was bad');
        }

        if (isProposalGood) {
            logger.info(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"', proposalResponses[0].response.status, proposalResponses[0].response.message));
            var promises = [];
            let event_hubs = channel.getChannelEventHubsForOrg();
            event_hubs.forEach((eh) => {
                logger.debug('invokeEventPromise - setting up event');
                let invokeEventPromise = new Promise((resolve, reject) => {
                    let regid = null;
                    let event_timeout = setTimeout(() => {
                        if (regid) {
                            let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
                            logger.error(message);
                            eh.unregisterChaincodeEvent(regid);
                            eh.disconnect();
                        }
                        reject();
                    }, 20000);

                    regid = eh.registerChaincodeEvent('mycc', args.fn, (event, block_num, txnid, status) => {
                        logger.info('Successfully got a chaincode event with transid:' + txnid + ' with status:' + status);
                        let event_payload = event.payload.toString();
                        logger.info(event_payload);
                        if (event_payload.indexOf(hash) > -1) {
                            clearTimeout(event_timeout);
                            // Chaincode event listeners are meant to run continuously
                            // Therefore the default to automatically unregister is false
                            // So in this case we want to shutdown the event listener once
                            // we see the event with the correct payload
                            eh.unregisterChaincodeEvent(regid);
                            logger.info('Successfully received the chaincode event on block number ' + block_num);
                            resolve(event_payload);
                        } else {
                            logger.info('Successfully got chaincode event ... just not the one we are looking for on block number ' + block_num);
                        }
                    }, (err) => {
                        clearTimeout(event_timeout);
                        logger.error(err);
                        reject(err);
                    }
                        // no options specified
                        // startBlock will default to latest
                        // endBlock will default to MAX
                        // unregister will default to false
                        // disconnect will default to false
                    );
                    eh.connect(true);
                });
                promises.push(invokeEventPromise);
            });
            var requestMain = {
                txId: tx_id,
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            var sendPromise = channel.sendTransaction(requestMain);
            promises.push(sendPromise);

            let results = await Promise.all(promises);
            logger.debug(util.format('------->>> R E S P O N S E : %j', results));
            let response = results.pop(); //  orderer results are last in the results
            if (response.status === 'SUCCESS') {
                logger.info('Successfully sent transaction to the orderer.');
            } else {
                error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
                logger.debug(error_message);
            }

            // now see what each of the event hubs reported
            for (let i in results) {
                let event_hub_result = results[i];
                let event_hub = event_hubs[i];
                logger.debug('Event results for event hub : %s', event_hub.getPeerAddr());
                if (typeof event_hub_result === 'string') {
                    logger.debug(event_hub_result);
                    var result = { event_payload: event_hub_result };
                    break;
                    // return result;
                } else {
                    if (!error_message) error_message = event_hub_result.toString();
                    logger.debug(event_hub_result.toString());
                }
            }
        } else {
            error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
            logger.debug(error_message);
        }
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();



