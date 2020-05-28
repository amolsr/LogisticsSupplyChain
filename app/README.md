### Enrolling Identities

```
node enrollAdmin.js --org=org1
node enrollAdmin.js --org=org2
node registerUser.js --org=org1
node registerUser.js --org=org2
```

#### Copy the pdf file to the asset directory

### Transaction In Blockchain

```
node invoke.js --org=org1 --filename=property.pdf --to=Org1MSP --fn=assign
node invoke.js --org=org1 --filename=property.pdf --to=Org2MSP --fn=transfer
node invoke.js --org=org2 --filename=property.pdf --to=Org1MSP --fn=transfer
node query.js --org=org1 --filename=property.pdf --fn=read
```
