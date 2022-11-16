import { Rank, Suit, Tile, TileBuilder } from "@scripts/MahjongDataTypes";
import React, { forwardRef, useImperativeHandle } from "react";
import Image from "next/image";

function PickerBox<D>(props: { className?: string; text: string; data: D; onClick: (data: D) => void; })
{
	return (
		<button className={"p-3 rounded-full hover:rounded-lg bg-slate-400 hover:bg-green-300 hover:z-10 place-self-center transition-all" + props.className} onClick={() => props.onClick(props.data)}>{props.text}</button>
	);
}

const divStyle = "w-full h-full flex items-center align-middle justify-center object-cover";

const TilePicker = forwardRef(function (props: {}, ref: React.Ref<{ getTile: () => Tile }>)
{
	const [tile, setTile] = React.useState<TileBuilder>({ rank: Rank.Back, suit: Suit.Back });
	const [state, setState] = React.useState<number>(3);

	useImperativeHandle(ref, () => ({
		getTile: () => Tile.fromBuilder(tile)
	}));


	const suitScreen = [{
		text: "B",
		data: Suit.Bamboo,
	}, {
		text: "C",
		data: Suit.Character,
	}, {
		text: "D",
		data: Suit.Dot,
	}, null, {
		text: "H",
		data: Suit.Honor,
	}, null, null].map((x, i) =>
		<div className={divStyle}>
			{x && <PickerBox key={x.text} text={x.text} data={x.data} onClick={(data: Suit) => { setTile({ ...tile, suit: data }); setState(data == Suit.Honor ? 2 : 1) }} />}
		</div>
	);
	suitScreen.push(<div className={divStyle}>
		<PickerBox text="X" data={null} onClick={() => { setState(3); setTile({ rank: Rank.Back, suit: Suit.Back, isRed: false }) }} />
	</div>);
	suitScreen.push(<div className={divStyle}></div>);

	const numberScreen = [{
		text: "1",
		data: Rank.One,
	}, {
		text: "2",
		data: Rank.Two,
	}, {
		text: "3",
		data: Rank.Three,
	}, {
		text: "4",
		data: Rank.Four,
	}, {
		text: "5",
		data: Rank.Five,
	}, {
		text: "6",
		data: Rank.Six,
	}, {
		text: "7",
		data: Rank.Seven,
	}, {
		text: "8",
		data: Rank.Eight,
	}, {
		text: "9",
		data: Rank.Nine,
	}].map((x, i) =>
		<div className={divStyle}>
			<PickerBox key={x.text} text={x.text} data={x.data} onClick={(data: Rank) => { setTile({ ...tile, rank: data }); setState(3); }} />
		</div>
	);

	const honorScreen = [
		{
			text: "G",
			data: Rank.GreenDragon,
		}, {
			text: "R",
			data: Rank.RedDragon,
		}, {
			text: "W",
			data: Rank.WhiteDragon,
		}, null, {
			text: "N",
			data: Rank.NorthWind,
		}, null, {
			text: "W",
			data: Rank.WestWind,
		}, {
			text: "S",
			data: Rank.SouthWind,
		}, {
			text: "E",
			data: Rank.EastWind,
		}
	].map((x, i) =>
		<div className={divStyle}>
			{x && <PickerBox key={x.text} text={x.text} data={x.data} onClick={(data: Rank) => { setTile({ ...tile, rank: data }); setState(3) }} />}
		</div>
	);

	const tileString = Tile.shortStringifyData(tile.rank ?? Rank.One, tile.suit ?? Suit.Bamboo, tile.isRed)

	return (
		<div className="relative w-full h-full aspect-[3/4] border-2 border-black">
			<div className={"absolute w-[210px] h-[280px] bottom-0 overflow-hidden origin-bottom z-10 transition-all border-4 border-black bg-slate-50 rounded-md"} style={{
				transform: `scale(${state === 3 ? 0 : 1})`,
			}}>
				<div className="absolute w-full h-full top-0 left-0 grid justify-center items-center grid-cols-3 grid-rows-3 p-1" style={{
					transform: `scale(${state !== 0 ? 0 : 1})`,
				}}>
					{suitScreen}
				</div>
				<div className="absolute w-full h-full top-0 left-0 grid justify-center items-center grid-cols-3 grid-rows-3 p-1" style={{
					transform: `scale(${state !== 1 ? 0 : 1})`,
				}}>
					{numberScreen}
				</div>
				<div className="absolute w-full h-full top-0 left-0 grid justify-center items-center grid-cols-3 grid-rows-3 p-1" style={{
					transform: `scale(${state !== 2 ? 0 : 1})`,
				}}>
					{honorScreen}
				</div>
			</div>
			<div className="absolute overflow-hidden w-full h-full top-0 left-0 grid justify-center items-center grid-cols-3 grid-rows-3 p-1 transition-all" style={{
				// transform: `translateX(${state === 3 ? 0 : 120}%)`,
			}}>
				<button className={divStyle + " col-span-3 row-span-3 group"} onClick={() => state == 0 ? setState(3) : setState(0)}>
					<Image className="w-full top-0 group-hover:brightness-110" src={(tileString.startsWith("NaN")) ? "/mahjong_tiles/xx.png" : "/mahjong_tiles/" + tileString + ".png"} layout="fill" />
				</button>
				{/* <PickerBox className=" absolute bottom-1 left-1 bg-red-400" text={"<"} data={null} onClick={(data: null) => { setState(0) }} /> */}
				{tile.rank == Rank.Five && <PickerBox className=" absolute bottom-1 right-1" text={"$"} data={null} onClick={(data: null) => { setTile({ ...tile, isRed: !tile.isRed }) }} />}
			</div>
		</div>
	);
});

export default TilePicker;