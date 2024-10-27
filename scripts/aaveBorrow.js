const { ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")

const main = async () => {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner()
    //console.log("Deployer", deployer)
    const lendingPool = await getLendingPool(signer)
    //console.log("Lending pool address", lendingPool.target)

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve
    await approveErc20(wethTokenAddress, lendingPool.target, AMOUNT, signer)

    console.log("Depositing....")

    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer, 0)

    console.log("Deposited")

    //borrow
    let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
        lendingPool,
        signer,
    )
    const daiPrice = await getDaiPrice()

    const amountDaiToBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / Number(daiPrice))

    const amountDaiToBorrowWei = ethers.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrowWei} DAI `)

    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, signer)

    await getBorrowUserData(lendingPool, signer)
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, signer)
    await getBorrowUserData(lendingPool, signer)
}

const repay = async (amount, daiAddress, lendingPool, account) => {
    await approveErc20(daiAddress, lendingPool.target, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 2, account)
    await repayTx.wait(1)
    console.log("repayed")
}

const borrowDai = async (
    daiAddress,
    lendingPool,
    amountDaiToBorrowWei,
    account,
) => {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        2,
        0,
        account,
    )
    await borrowTx.wait(1)
    console.log(`You have borrowed`)
}

const getDaiPrice = async () => {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
        // ,"0x6B175474E89094C44Da98b954EedeAC495271d0F"
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log("Dai Eth price is", price.toString())
    return price
}

const getBorrowUserData = async (lendingPool, account) => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of eth deposited`)
    console.log(`You have ${totalDebtETH} worth of eth borrowed`)
    console.log(`You can borrow ${availableBorrowsETH} worth of eth`)
    return { totalDebtETH, availableBorrowsETH }
}

const getLendingPool = async (account) => {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account,
    )
    const lendingPoolAddress =
        await lendingPoolAddressesProvider.getLendingPool()

    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account,
    )
    return lendingPool
}
const approveErc20 = async (
    erc20address,
    spenderAddress,
    amountToSpend,
    account,
) => {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20address,
        account,
    )

    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    //console.log("tx", tx)
    await tx.wait(1)
    console.log("Approved")
}
//lending pool address provider : 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
