### Create Cryptological Artifacts (All Ready Generated)

```
 ../bin/cryptogen generate --config=./crypto-config.yaml
 export FABRIC_CFG_PATH=$PWD
 ../bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block
 ../bin/configtxgen -profile Channel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID channel12
```

### Compose Docker Images

```
 cd deployment/
 docker-compose -f docker-compose-orderer.yml up -d
 docker-compose -f docker-compose-node1.yml up -d
 docker-compose -f docker-compose-node2.yml up -d
```

### Create Channel

```
 docker exec -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c channel12 -f /var/hyperledger/configs/channel.tx
 docker cp peer0.org1.example.com:channel12.block .
 docker cp channel12.block peer0.org2.example.com:/channel12.block
```

### Join Channel

```
 docker exec -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b channel12.block
 docker exec -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b channel12.block
```

### Install Chaincode

```
 docker exec -it cli-org1 peer chaincode install -n mycc -p github.com/chaincode/ATA -v v0
 docker exec -it cli-org2 peer chaincode install -n mycc -p github.com/chaincode/ATA -v v0
```

### Instantiate Chaincode

```
 docker exec -it cli-org1 peer chaincode instantiate -o orderer.example.com:7050 -C channel12 -n mycc github.com/chaincode/ATA -v v0 -c '{"Args": []}' -P "OR('Org1MSP.member', 'Org2MSP.member')"
```

### Testing Purpose

```
docker exec -it cli-org1 peer chaincode invoke -o orderer.example.com:7050 -C channel12 -n mycc -c '{"Args":["assign","abcd","Org2MSP"]}'
docker exec -it cli-org1 peer chaincode query -C channel12 -n mycc -c '{"Args":["read","abcd"]}'
docker exec -it cli-org1 peer chaincode invoke -o orderer.example.com:7050 -C channel12 -n mycc -c '{"Args":["transfer","abcd","Org1MSP"]}'
docker exec -it cli-org1 peer chaincode query -C channel12 -n mycc -c '{"Args":["read","abcd"]}'
docker exec -it cli-org2 peer chaincode query -C channel12 -n mycc -c '{"Args":["read","admin"]}'
```
