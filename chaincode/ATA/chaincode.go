package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	peer "github.com/hyperledger/fabric/protos/peer"
)

// Chaincode is the definition of the chaincode structure.
type Chaincode struct {
}

// Init is called when the chaincode is instantiated by the blockchain network.
func (t *Chaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	mspID, err := cid.GetMSPID(stub)
	if err != nil {
		return shim.Error("Can not get admin mspid")
	}
	err = stub.PutState("admin", []byte(mspID)) //write the variable into the ledger
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

// Invoke is called as a result of an application request to run the chaincode.
func (t *Chaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, params := stub.GetFunctionAndParameters()
	fmt.Println("Invoke()", function, params)

	// Handle different functions
	if function == "init" { //initialize the chaincode state, used as reset
		return t.Init(stub)
	} else if function == "read" { //generic read ledger
		return read(stub, params)
	} else if function == "assign" { //create Asset
		return assign(stub, params)
	} else if function == "transfer" { //create Asset
		return transfer(stub, params)
	}

	// error out
	fmt.Println("Received unknown invoke function name - " + function)
	return shim.Error("Received unknown invoke function name - '" + function + "'")
}
