package com.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import jakarta.annotation.PostConstruct;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;

@Service
public class BlockchainService {

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.agent-private-key}")
    private String privateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    private Web3j web3j;
    private Credentials credentials;

    @PostConstruct
    public void init() {
        this.web3j = Web3j.build(new HttpService(rpcUrl));
        this.credentials = Credentials.create(privateKey);
    }

    /**
     * 调用合约 recordDayComplete 方法
     * @param userAddress 用户地址
     * @param challengeId 挑战ID
     * @return 交易哈希
     */
    public String recordDayComplete(String userAddress, BigInteger challengeId) throws Exception {
        System.out.println("Processing blockchain transaction...");
        System.out.println("Contract Address: " + contractAddress);
        System.out.println("RPC URL: " + rpcUrl);
        System.out.println("User Address: " + userAddress);
        System.out.println("Challenge ID: " + challengeId);

        // 1. 构建函数调用
        Function function = new Function(
                "recordDayComplete",
                Arrays.asList(new Address(userAddress), new Uint256(challengeId)),
                Collections.emptyList()
        );
        
        String encodedFunction = FunctionEncoder.encode(function);
        System.out.println("Encoded Function: " + encodedFunction);

        // 2. 获取 Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                credentials.getAddress(), DefaultBlockParameterName.LATEST).send();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();
        System.out.println("Nonce: " + nonce);

        // 3. 构建交易
        // 注意：这里需要估算 Gas，简单起见先给一个固定值或后续优化
        BigInteger gasLimit = BigInteger.valueOf(300000); 
        // 获取当前 Gas Price
        BigInteger gasPrice = web3j.ethGasPrice().send().getGasPrice();
        System.out.println("Gas Price: " + gasPrice);

        RawTransaction rawTransaction = RawTransaction.createTransaction(
                nonce,
                gasPrice,
                gasLimit,
                contractAddress,
                encodedFunction
        );

        // 4. 签名交易
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, credentials);
        String hexValue = Numeric.toHexString(signedMessage);
        System.out.println("Signed Transaction Hex: " + hexValue);

        // 5. 发送交易
        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();

        if (ethSendTransaction.hasError()) {
            throw new RuntimeException("Blockchain transaction failed: " + ethSendTransaction.getError().getMessage());
        }

        String txHash = ethSendTransaction.getTransactionHash();
        System.out.println("Transaction Sent Successfully! Hash: " + txHash);
        return txHash;
    }
}
