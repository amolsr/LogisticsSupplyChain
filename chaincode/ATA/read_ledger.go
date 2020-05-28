package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	peer "github.com/hyperledger/fabric/protos/peer"
)

//Generic Read Function
func read(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var key, jsonResp string
	var err error
	fmt.Println("starting read")

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting key of the var to query")
	}

	key = args[0]
	valAsbytes, err := stub.GetState(key)           //get the var from ledger
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
		return shim.Error(jsonResp)
	}

	fmt.Println("- end read")
	return shim.Success(valAsbytes)                  //send it onward
}