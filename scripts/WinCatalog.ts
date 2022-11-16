import { Yaakuman } from "./MahjongDataTypes";

/** A constant for all wins */
export const WinCatalog =
{
	Double_Riichi: {
		name: "Double Riichi",
		desc: "Riichi twice in the same hand",
		open_han: null,
		closed_han: 1
	},
	Riichi: {
		name: "Riichi",
		desc: "Declare riichi before the first discard",
		open_han: null,
		closed_han: 1
	},
	Ippatsu: {
		name: "Ippatsu",
		desc: "Win on the first discard after declaring riichi",
		open_han: null,
		closed_han: 1
	},
	Menzenchin_Tsumo: {
		name: "Menzenchin Tsumo",
		desc: "Win by tsumo with no discards",
		open_han: null,
		closed_han: 1
	},
	Under_The_Sea: {
		name: "Under The Sea",
		desc: "Win with all tiles in your hand being 1-4",
		open_han: 1,
		closed_han: 1
	},
	Under_The_River: {
		name: "Under The River",
		desc: "Win with all tiles in your hand being 5-8",
		open_han: 1,
		closed_han: 1
	},
	Rinshan_Kaihou: {
		name: "Rinshan Kaihou",
		desc: "Win by tsumo after drawing the winning tile from the wall",
		open_han: 1,
		closed_han: 1
	},
	Robbing_A_Kan: {
		name: "Robbing A Kan",
		desc: "Win by tsumo after drawing the winning tile from a kan",
		open_han: 1,
		closed_han: 1
	},
	Seven_Pairs: {
		name: "Seven Pairs",
		desc: "Win with seven pairs",
		open_han: null,
		closed_han: 2
	},
	Thirteen_Orphans: {
		name: "Thirteen Orphans",
		desc: "Win with all terminals and honors",
		open_han: null,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	Pinfu: {
		name: "Pinfu",
		desc: "Win with a simple hand",
		open_han: null,
		closed_han: 1
	},
	Pure_Double_Sequence: {
		name: "Pure Double Sequence",
		desc: "Win with two sequences of the same suit",
		open_han: 1,
		closed_han: 1
	},
	Twice_Pure_Double_Sequence: {
		name: "Twice Pure Double Sequence",
		desc: "Win with two sequences of the same suit and two sequences of the same suit",
		open_han: 3,
		closed_han: 3
	},
	Yakuhai_Dragons: {
		name: "Yakuhai Dragons",
		desc: "Win with a dragon yakuhai",
		open_han: 1,
		closed_han: 1
	},
	Prevalent_Wind: {
		name: "Prevalent Wind",
		desc: "Win with the prevalent wind in your hand",
		open_han: 1,
		closed_han: 1
	},
	Seat_Wind: {
		name: "Seat Wind",
		desc: "Win with the seat wind in your hand",
		open_han: 1,
		closed_han: 1
	},
	Little_Three_Dragons: {
		name: "Little Three Dragons",
		desc: "Win with the east, south, and west dragons in your hand",
		open_han: 2,
		closed_han: 2
	},
	Big_Three_Dragons: {
		name: "Big Three Dragons",
		desc: "Win with the east, south, and west dragons in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	Little_Four_Winds: {
		name: "Little Four Winds",
		desc: "Win with the east, south, west, and north winds in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	Big_Four_Winds: {
		name: "Big Four Winds",
		desc: "Win with the east, south, west, and north winds in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Double
	},
	Mixed_Triple_Sequence: {
		name: "Mixed Triple Sequence",
		desc: "Win with three sequences of different suits",
		open_han: 1,
		closed_han: 2
	},
	Pure_Straight: {
		name: "Pure Straight",
		desc: "Win with a straight of all the same suit",
		open_han: 1,
		closed_han: 2
	},
	All_Terminals: {
		name: "All Terminals",
		desc: "Win with all terminals in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	All_Honors: {
		name: "All Honors",
		desc: "Win with all honors in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	All_Simples: {
		name: "All Simples",
		desc: "Win with all simples in your hand",
		open_han: 1,
		closed_han: 1
	},
	Full_Outside_Hand: {
		name: "Full Outside Hand",
		desc: "Win with all terminals and honors in your hand",
		open_han: 3,
		closed_han: 2
	},
	Half_Outside_Hand: {
		name: "Half Outside Hand",
		desc: "Win with all terminals and honors in your hand",
		open_han: 1,
		closed_han: 2
	},
	All_Triplets: {
		name: "All Triplets",
		desc: "Win with all triplets in your hand",
		open_han: 2,
		closed_han: null // Cannot be awarded in closed hand, as it would be concealed triplets
	},
	Three_Concealed_Triplets: {
		name: "Three Concealed Triplets",
		desc: "Win with three concealed triplets",
		open_han: 2,
		closed_han: 2
	},
	Four_Concealed_Triplets: {
		name: "Four Concealed Triplets",
		desc: "Win with four concealed triplets",
		open_han: null,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	Single_Wait_Four_Concealed_Triplets: {
		name: "Single Wait Four Concealed Triplets",
		desc: "Win with four concealed triplets and a single wait",
		open_han: null,
		closed_han: 0,
		yaakuman: Yaakuman.Double
	},
	Three_Kans: {
		name: "Three Kan",
		desc: "Win with three kan",
		open_han: 2,
		closed_han: 2
	},
	Four_Kans: {
		name: "Four Kan",
		desc: "Win with four kan",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	Triple_Triplets: {
		name: "Triple Triplets",
		desc: "Win with three triplets",
		open_han: 2,
		closed_han: 2
	},
	All_Green: {
		name: "All Green",
		desc: "Win with all green tiles in your hand",
		open_han: 0,
		closed_han: 0,
		yaakuman: Yaakuman.Single
	},
	True_Nine_Gates: {
		name: "True Nine Gates",
		desc: "Win with all terminals and honors in your hand",
		open_han: null,
		closed_han: 0,
		yaakuman: Yaakuman.Double,
	},
	Nine_Gates: {
		name: "Nine Gates",
		desc: "Win with all terminals and honors in your hand",
		open_han: null,
		closed_han: 0,
		yaakuman: Yaakuman.Single,
	},
	Full_Flush: {
		name: "Full Flush",
		desc: "Win with a flush of all the same suit",
		open_han: 5,
		closed_han: 6
	},
	Half_Flush: {
		name: "Half Flush",
		desc: "Win with a flush of all the same suit",
		open_han: 2,
		closed_han: 3
	},
	Dora_Indicator: {
		name: "Dora Indicator",
		desc: "Win with a dora indicator in your hand",
		open_han: 1,
		closed_han: 1
	},
	Red_Five: {
		name: "Red Five",
		desc: "Win with a red five in your hand",
		open_han: 1,
		closed_han: 1
	},
}