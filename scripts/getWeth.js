const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = ethers.parseEther("0.02")
const getWeth = async () => {
    const { deployer } = await getNamedAccounts()
    //console.log("Deployer", deployer)
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer.address,
    )

    const tx = await iWeth.deposit({
        value: AMOUNT,
    })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log("Weth Balance", wethBalance)
}

module.exports = { getWeth, AMOUNT }
