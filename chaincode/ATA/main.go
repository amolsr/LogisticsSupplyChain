/*
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import "github.com/hyperledger/fabric/core/chaincode/shim"

//peer chaincode invoke -C mychannel -n datapitcher@1.13 -c '{"Args":["read","123"]}'

func main() {
	err := shim.Start(new(Chaincode))
	if err != nil {
		panic(err)
	}
}
