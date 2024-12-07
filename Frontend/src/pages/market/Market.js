import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    Textarea,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";
import { basicAxios } from "../../api/customAxios";
import CustomNavbar from "../../components/customnavbar/CustomNavbar";
import "./market.css";
import Buy from "../../components/Buy";
import Sell from "../../components/Sell";

const coins = [
    { ws: "btcusdt@trade", name: "Bitcoin", symbol: "BTC" },
    { ws: "ethusdt@trade", name: "Ethereum", symbol: "ETH" },
    { ws: "bnbusdt@trade", name: "Binance Coin", symbol: "BNB" },
    { ws: "solusdt@trade", name: "Solana", symbol: "SOL" },
    { ws: "dotusdt@trade", name: "Polkadot", symbol: "DOT" },
    { ws: "avaxusdt@trade", name: "Avalanche", symbol: "AVAX" },
    { ws: "linkusdt@trade", name: "Chainlink", symbol: "LINK" },
    { ws: "ltcusdt@trade", name: "Litecoin", symbol: "LTC" },
    { ws: "bchusdt@trade", name: "Bitcoin Cash", symbol: "BCH" },
    { ws: "etcusdt@trade", name: "Ethereum Classic", symbol: "ETC" },
];

const Market = () => {
    const [balance, setBalance] = useState("");
    const [change, setChange] = useState(0);
    const [pricing, setPricing] = useState({});
    const [priceFluctuation, setPriceFluctuation] = useState({});
    const [currentCoin, setCurrentCoin] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure(false);
    const [valInr, setValInr] = useState("");

    const fetchBalanceAndStock = async () => {
        try {
            const balanceResponse = await basicAxios.post(
                "/trading/getbalance/",
                {
                    jwt_token: localStorage.getItem("jwt_token"),
                }
            );
            const stockResponse = await basicAxios.post("/trading/getstock/", {
                jwt_token: localStorage.getItem("jwt_token"),
            });

            const prevWealth = balanceResponse.data.balance;
            let currentWealth = 0;

            stockResponse.data.forEach((stock) => {
                const price = pricing[stock.stock_name] || 0;
                currentWealth += price * parseInt(stock.stock_quantity);
            });

            const delta = prevWealth + currentWealth - 100000;
            setBalance(prevWealth);
            setChange(delta);
        } catch (err) {
            console.error(err);
        }
    };

    const handleWebSocket = (coinSymbol, wsUrl) => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsUrl}`);
        let lastPrice = 0;

        ws.onmessage = (event) => {
            const stockObject = JSON.parse(event.data);
            const currentPrice = parseInt(stockObject.p);

            setPricing((prev) => ({ ...prev, [coinSymbol]: currentPrice }));
            setPriceFluctuation((prev) => ({
                ...prev,
                [coinSymbol]: {
                    color:
                        !lastPrice || lastPrice === currentPrice
                            ? "white"
                            : currentPrice > lastPrice
                            ? "green"
                            : "red",
                },
            }));

            lastPrice = currentPrice;
        };
    };

    const togglePopup = (coin, action) => {
        setCurrentCoin({ ...coin, action });
        onOpen();
    };

    useEffect(() => {
        coins.forEach((coin) => handleWebSocket(coin.symbol, coin.ws));
        fetchBalanceAndStock();
    }, []);

    return (
        <div className="dashbrd-container">
            <CustomNavbar
                isDashboard={false}
                isStockWindow={true}
                isTransaction={false}
            />
            <div className="container-fluid mtb15 no-fluid">
                <div className="flex">
                    <div className="col-sm-12 col-md-3">
                        <Textarea
                            isDisabled
                            label="Balance / Leverage"
                            placeholder={`$${balance}`}
                            className="dark text-foreground max-w-xs ml-2.5 mr-5 mt-5 mb-5"
                            style={{
                                textAlign: "center",
                                color: "white",
                                padding: "40px",
                                fontSize: "50px",
                            }}
                        />
                    </div>
                    <div className="col-sm-12 col-md-6">
                        <Textarea
                            isDisabled
                            label="Net Profit / Loss"
                            placeholder={`$${change}`}
                            className="dark text-foreground max-w-xs ml-2.5 mr-5 mt-5 mb-5"
                            style={{
                                textAlign: "center",
                                color: "white",
                                padding: "40px",
                                fontSize: "50px",
                            }}
                        />
                    </div>
                    <div className="col md-2.5 mt-5">
                        <Textarea
                            variant="underlined"
                            label="USD"
                            value={valInr}
                            onValueChange={setValInr}
                        />
                        <Textarea
                            isDisabled
                            variant="underlined"
                            label="INR"
                            value={83 * parseInt(valInr || 0)}
                        />
                    </div>
                </div>

                <Table
                    className="dark text-foreground bg-background"
                    striped
                    bordered
                    hover
                >
                    <TableHeader>
                        <TableColumn>#</TableColumn>
                        <TableColumn>Coin</TableColumn>
                        <TableColumn>Handle</TableColumn>
                        <TableColumn>Price</TableColumn>
                        <TableColumn>Buy</TableColumn>
                        <TableColumn>Sell</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {coins.map((coin, index) => (
                            <TableRow key={coin.symbol}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{coin.name}</TableCell>
                                <TableCell>{coin.symbol}</TableCell>
                                <TableCell
                                    style={
                                        priceFluctuation[coin.symbol] || {
                                            color: "white",
                                        }
                                    }
                                >
                                    ${pricing[coin.symbol] || 0}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        color="success"
                                        variant="ghost"
                                        onClick={() => togglePopup(coin, "buy")}
                                    >
                                        BUY
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        color="danger"
                                        variant="ghost"
                                        onClick={() =>
                                            togglePopup(coin, "sell")
                                        }
                                    >
                                        SELL
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {currentCoin && (
                    <Modal
                        backdrop="blur"
                        isOpen={isOpen}
                        onClose={onClose}
                        placement="center"
                    >
                        <ModalContent>
                            <ModalHeader>
                                {currentCoin.action === "buy" ? "Buy" : "Sell"}
                            </ModalHeader>
                            <ModalBody>
                                {currentCoin.action === "buy" ? (
                                    <Buy
                                        name={currentCoin.symbol}
                                        price={pricing[currentCoin.symbol]}
                                        change={change}
                                        balance={balance}
                                        setChange={setChange}
                                        setBalance={setBalance}
                                    />
                                ) : (
                                    <Sell
                                        name={currentCoin.symbol}
                                        price={pricing[currentCoin.symbol]}
                                        change={change}
                                        balance={balance}
                                        setChange={setChange}
                                        setBalance={setBalance}
                                    />
                                )}
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default Market;
