package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	peer "github.com/hyperledger/fabric/protos/peer"
)

//Creating an asset
func assign(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	asset := args[0]
	owner := args[1]

	// Verify the identity of the caller
	// Only an administrator can invoker assign
	adminCertificate, err := stub.GetState("admin")
	if err != nil {
		return shim.Error("Failed fetching admin identity")
	}
	mspID, err := cid.GetMSPID(stub)
	if err != nil {
		return shim.Error("Can not get admin mspid")
	}
	adminID := string(adminCertificate)
	if mspID != adminID {
		return shim.Error("failed to validate admin Certificate")
	}

	// Register assignment
	err = stub.PutState(asset, []byte(owner))
	if err != nil {
		return shim.Error(err.Error())
	}

	eventPayload := "Asset with ID " + args[0] + " is assign to " + owner
	payloadAsBytes := []byte(eventPayload)
	eventErr := stub.SetEvent("assign", payloadAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	return shim.Success(nil)
}

//Creating an asset
func transfer(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	asset := args[0]
	owner := args[1]

	// Verify the identity of the caller
	// Only an administrator can invoker assign
	previousOwnerAsBytes, err := stub.GetState(asset)
	if err != nil {
		return shim.Error("No Asset found")
	}
	mspID, err := cid.GetMSPID(stub)
	if err != nil {
		return shim.Error("Can not get mspid")
	}
	previousOwner := string(previousOwnerAsBytes)
	if mspID != previousOwner {
		return shim.Error("failed to validate Owner")
	}
	err = stub.PutState(asset, []byte(owner))
	if err != nil {
		return shim.Error(err.Error())
	}

	eventPayload := "Asset with ID " + args[0] + " is assign to " + owner + " from " + previousOwner
	payloadAsBytes := []byte(eventPayload)
	eventErr := stub.SetEvent("transfer", payloadAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	return shim.Success([]byte(owner))
}
