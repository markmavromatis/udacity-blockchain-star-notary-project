const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('name/symbol test', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    const name = await instance.name();
    const symbol = await instance.symbol();

    assert.equal(name, "Udacity Star Token" );
    assert.equal(symbol, "UST" );
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();

    // Retrieve gas price for the last added block
    const lastBlock = await web3.eth.getBlock("latest");
    const gasPriceForLastBlock = lastBlock.baseFeePerGas;

    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: gasPriceForLastBlock});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    assert.isAbove(Number(balanceOfUser2BeforeTransaction), Number(balanceAfterUser2BuysStar));
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    // 2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let tokenId = 100;
    let instance = await StarNotary.deployed();
    const EXPECTED_CONTRACT_NAME = "Udacity Star Token";
    const EXPECTED_CONTRACT_SYMBOL = "UST";
    const starName = 'Another Awesome Star!'
    await instance.createStar(starName, tokenId, {from: accounts[0]})
    assert.equal(await instance.name(), EXPECTED_CONTRACT_NAME);
    assert.equal(await instance.symbol(), EXPECTED_CONTRACT_SYMBOL);
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    const star1TokenId = 200;
    const star1Name = 'Star 1';
    const star1OriginalOwner = accounts[0];
    const star2TokenId = 210;
    const star2Name = 'Star 2'
    const star2OriginalOwner = accounts[1];
    let instance = await StarNotary.deployed();
    await instance.createStar(star1Name, star1TokenId, {from: star1OriginalOwner});
    await instance.createStar(star2Name, star2TokenId, {from: star2OriginalOwner});

    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(star1TokenId, star2TokenId);

    // 3. Verify that the owners changed
    const star1NewOwner = (await instance.lookUpTokenIdToStarInfo(star1TokenId))["owner"];
    const star2NewOwner = (await instance.lookUpTokenIdToStarInfo(star2TokenId))["owner"];
    assert.equal(star1OriginalOwner, star2NewOwner);
    assert.equal(star2OriginalOwner, star1NewOwner);

});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    const starTokenId = 300;
    const starName = 'Star 300';
    const starOriginalOwner = accounts[0];
    const starTransferToOwner = accounts[1];
    let instance = await StarNotary.deployed();
    await instance.createStar(starName, starTokenId, {from: starOriginalOwner});

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(starTransferToOwner, starTokenId);

    // 3. Verify the star owner changed.
    const starNewOwner = (await instance.lookUpTokenIdToStarInfo(starTokenId))["owner"];
    assert.equal(starTransferToOwner, starNewOwner);

});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    const starTokenId = 400;
    const starName = 'Star 400';
    const starOwner = accounts[0];
    let instance = await StarNotary.deployed();
    await instance.createStar(starName, starTokenId, {from: starOwner});

    // 2. Call your method lookUptokenIdToStarInfo
    const starInfo = await instance.lookUpTokenIdToStarInfo(starTokenId);

    // 3. Verify if you Star name is the same
    const actualStarName = starInfo["name"];
    assert.equal(starName, actualStarName);
});