import TilePicker from "@components/TilePicker";
import { PlayerBoard } from "@scripts/Evaluator";
import { Rank, Suit, Tile, TileGroup, Yaakuman } from "@scripts/MahjongDataTypes";
import React, { forwardRef, useImperativeHandle } from "react";

const TileGrouping = forwardRef((props: { title: string, startingTiles: number }, ref: React.Ref<{ getTiles: () => Tile[] }>) =>
{
	const [tileCount, setTileCount] = React.useState<number>(props.startingTiles);
	const tiles = [];
	const tile_refs: React.RefObject<{ getTile: () => Tile; }>[] = [];

	useImperativeHandle(ref, () => ({
		getTiles: () => tile_refs.map(x => x.current?.getTile() ?? new Tile(Suit.Back, Rank.Back))
	}));

	for (let i = 0; i < tileCount; i++)
	{
		const ref = React.createRef<{ getTile: () => Tile; }>();
		tiles.push(<TilePicker key={i} ref={ref} />);
		tile_refs.push(ref);
	}

	return (
		<div className="grid md:grid-cols-9 lg:grid-cols-[14] xl:grid-cols-[40] grid-row-2 ml-2 mt-1 mr-2 p-1 border-black border-2 bg-slate-100 rounded-sm">
			<div className="col-span-9 text-center text-xl font-bold border-amber-500 border-b-2">
				<h1>{props.title + ` (${tiles.length})`}</h1>
			</div>
			<div className="col-span-7 grid grid-cols-8 grid-row-1">
				{tiles}
			</div>
			<div className="col-span-2 grid grid-cols-1 grid-row-3">
				<button className="rounded-md bg-orange-300 m-1" onClick={() => setTileCount(tileCount + 1)}>Add Tile</button>
				<button className="rounded-md bg-orange-300 m-1" onClick={() => setTileCount(tileCount - 1)}>Remove Tile</button>
			</div>
		</div>
	)
});


export default function Home()
{
	const [tileGroupsCount, setTileGroupsCount] = React.useState<number>(2);
	const [message, setMessage] = React.useState<string>("(A message will appear here when calculating the hand.)");
	const tile_group_refs: React.RefObject<{ getTiles: () => Tile[]; }>[] = [];
	const winningTile = React.createRef<{ getTile: () => Tile; }>();

	const [tsumo, setTsumo] = React.useState<boolean>(false);
	const [riichi, setRiichi] = React.useState<boolean>(false);
	const [ippatsu, setIppatsu] = React.useState<boolean>(false);
	const [daburuRiichi, setDaburuRiichi] = React.useState<boolean>(false);
	const [lastDrawWin, setLastDrawWin] = React.useState<boolean>(false);
	const [playerWind, setPlayerWind] = React.useState<Rank>(Rank.EastWind);
	const [roundWind, setRoundWind] = React.useState<Rank>(Rank.EastWind);

	const tileGroups = [];
	for (let i = 0; i < tileGroupsCount; i++)
	{
		const ref = React.createRef<{ getTiles: () => Tile[]; }>();
		const title = i == 0 ? "Dora Indicators" : i == 1 ? "Closed Tiles" : "Open Group " + (i - 1);
		tileGroups.push(<TileGrouping key={title} ref={ref} title={title} startingTiles={i == 0 ? 1 : i == 1 ? 8 : 3} />);
		tile_group_refs.push(ref);
	}
	
	const calcHand = () =>
	{
		console.log("Calculating hand...");
		
		const closedGroup = tile_group_refs[1].current?.getTiles() ?? [];
		const doraIndicators = tile_group_refs[0].current?.getTiles() ?? [];
		const openGroups = tile_group_refs.slice(2).map(ref => ref.current?.getTiles() ?? []);
		const winTile = winningTile.current?.getTile() ?? new Tile(Suit.Back, Rank.Back);
		const board = new PlayerBoard();

		board.visibleHandTiles = openGroups;
		board.hiddenHandTiles = closedGroup;
		board.doraIndicators = doraIndicators;
		board.winningTile = winTile;

		board.seatWind = playerWind;
		board.prevalentWind = roundWind;
		board.tsumo = tsumo;
		board.riichi = riichi;
		board.ippatsu = ippatsu;
		board.doubleRiichi = daburuRiichi;
		board.lastDrawWin = lastDrawWin;
		board.kanWin = false;

		const error = board.ValidateHand();

		if (error != null)
		{
			console.log(error);
			setMessage(error);
		}
		else setMessage(`${board.wins.map(w =>
		{
			let hasYaku = w.yaakuman == Yaakuman.Single || w.yaakuman == Yaakuman.Double;
			let han = hasYaku ? (w.yaakuman == Yaakuman.Single ? "Yaakuman!" : "Double Yaakuman!") : ((board.closedHand ? w.closed_han : w.open_han) + " han");
			return w.name + ", " + han
		}).join("\n")}\n\nTitle: ${board.winTitle} (base win: ${board.baseWinAmount})\n\nPayout: ${board.payOrder}\n\nGroups: ${TileGroup.stringifyArray(board.allHandGroups)}`);
	}

	return (
		<div className="relative">
			<div className="grid grid-cols-9 col grid-row-2 ml-2 mt-1 mr-2 p-1 border-black border-2 bg-slate-100 rounded-sm">
				<div className="col-span-9 text-center text-xl font-bold border-amber-500 border-b-2">
					<h1>Hand Information</h1>
				</div>
				<div className="col-span-9 grid grid-cols-8 grid-row-1">
					<div className="grid grid-cols-1 grid-row-9">
						<div className="row-span-2 text-center text-xl font-bold">
							<h1>Winning Tile</h1>
						</div>
						<div className="row-span-7">
							<TilePicker ref={winningTile} />
						</div>
					</div>

					
					<button className="rounded-md m-1 bg-blue-300" style={{
						backgroundColor: tsumo ? "rgb(134 239 172)" : "rgb(147 197 253)",
					}} onClick={() => setTsumo(!tsumo)}>{tsumo ? "Tsumo (->Ron)" : "Ron (->Tsumo)"}</button>
					<div className="grid grid-cols-1 grid-row-2">
						<button className="rounded-md m-1" style={{
							backgroundColor: riichi ? "rgb(134 239 172)" : "rgb(252 165 165)",
						}} onClick={() => setRiichi(!riichi)}>{riichi ? "Riichi" : "No Riichi"}</button>
						<button className="rounded-md m-1" style={{
							backgroundColor: daburuRiichi ? "rgb(134 239 172)" : "rgb(252 165 165)",
						}} onClick={() => setDaburuRiichi(!daburuRiichi)}>{daburuRiichi ? "Daburu Riichi" : "No Daburu"}</button>
					</div>
					<button className="rounded-md m-1" style={{
						backgroundColor: ippatsu ? "rgb(134 239 172)" : "rgb(252 165 165)",
					}} onClick={() => setIppatsu(!ippatsu)}>{ippatsu ? "Ippatsu" : "No Ippatsu"}</button>
					<button className="rounded-md m-1" style={{
						backgroundColor: lastDrawWin ? "rgb(134 239 172)" : "rgb(252 165 165)",
					}} onClick={() => setLastDrawWin(!lastDrawWin)}>{lastDrawWin ? "Last Draw Win" : "Not Last Draw Win"}</button>
					
					<div className="col-span-3 grid grid-cols-2">
						<div className="grid grid-cols-2 grid-row-7">
							<div className="col-span-2 text-center text-xl font-bold">
								<h1>Seat Wind</h1>
							</div>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (playerWind == Rank.EastWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setPlayerWind(Rank.EastWind)}>EastWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (playerWind == Rank.SouthWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setPlayerWind(Rank.SouthWind)}>SouthWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (playerWind == Rank.WestWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setPlayerWind(Rank.WestWind)}>WestWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (playerWind == Rank.NorthWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setPlayerWind(Rank.NorthWind)}>NorthWind</button>
						</div>
						<div className="grid grid-cols-2 grid-row-7">
							<div className="col-span-2 text-center text-xl font-bold">
								<h1>Round Wind</h1>
							</div>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (roundWind == Rank.EastWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setRoundWind(Rank.EastWind)}>EastWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (roundWind == Rank.SouthWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setRoundWind(Rank.SouthWind)}>SouthWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (roundWind == Rank.WestWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setRoundWind(Rank.WestWind)}>WestWind</button>
							<button className="row-span-3 rounded-md m-1" style={{
								backgroundColor: (roundWind == Rank.NorthWind) ? "rgb(134 239 172)" : "rgb(252 165 165)",
							}} onClick={() => setRoundWind(Rank.NorthWind)}>NorthWind</button>
						</div>
					</div>
				</div>
			</div>
			{tileGroups}
			<div className="grid grid-cols-3 grid-row-1">
				<button className="rounded-md bg-yellow-300 m-1 p-5" onClick={() => calcHand()}>Calc Hand!</button>
				<button className="rounded-md bg-yellow-300 m-1 p-5 disabled:bg-gray-400" disabled={tileGroupsCount >= 6} onClick={() => setTileGroupsCount(tileGroupsCount + 1)}>Add Open Tile Group</button>
				<button className="rounded-md bg-yellow-300 m-1 p-5 disabled:bg-gray-400" disabled={tileGroupsCount <= 2} onClick={() => setTileGroupsCount(tileGroupsCount - 1)}>Remove Open Tile Group</button>
			</div>
			{message.split('\n').map(s => (s == "") ? <br/> : <h1 className="p-1">{s}</h1>)}
		</div>
	);
}