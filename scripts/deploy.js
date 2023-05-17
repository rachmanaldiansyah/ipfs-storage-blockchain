async function main() {
  const IPFSHashStorage = await ethers.getContractFactory("IPFSHashStorage");

  // Start deployment, returning a promise that resolves to a contract object
  const IPFSHashStorage_ = await IPFSHashStorage.deploy();
  console.log("Contract address:", IPFSHashStorage_.address);


}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });