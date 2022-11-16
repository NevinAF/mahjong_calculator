import { InvalidClosedHandError, InvalidHandAndTilesError, InvalidScoreArgumentsError, Rank, Suit, Tile, Win, Yaakuman } from "./MahjongDataTypes";
import { WinCatalog } from "./WinCatalog";

export class Hand
{
	/** Each group will be an open meld or closed kan */
	public openGroups: Tile[][];
	/** Each group will be a closed meld */
	public closedTiles: Tile[];

	constructor(openGroups: Tile[][] = [], closedTiles: Tile[] = [])
	{
		this.openGroups = openGroups;
		this.closedTiles = closedTiles;
	}

	public isClosed(): boolean
	{
		return this.openGroups.length == 0 || this.openGroups.every(group => group.length == 4 && group.filter(tile => tile.rank == Rank.Back).length == 2);
	}

	public AddGroup(group: Tile[])
	{
		this.openGroups.push(group);
	}

	public AddClosedTile(tile: Tile)
	{
		this.closedTiles.push(tile);
	}

	// public isValid(): boolean
	// {
	// 	let tileCount: number = 0;
	// 	let foundClosedTiles: boolean = false;

	// 	for (let group of this.tileGroups)
	// 	{
	// 		if (!Tile.isMeld(group))
	// 		{
	// 			tileCount += group.length;
	// 			foundClosedTiles = true;
	// 		}
	// 		else
	// 		{
	// 			tileCount += 3;
	// 		}
	// 	}

	// 	return tileCount == 14 && foundClosedTiles;
	// }

	public static ValidateHandAndTiles(closed_tiles: Tile[], open_tiles: Tile[][], dora_indicators: Tile[])
	{
		console.log("Validating hand and tiles: closed_tiles = " + Tile.stringifyArray(closed_tiles) + ", open_tiles = " + Tile.stringifyGroups(open_tiles) + ", dora_indicators = " + Tile.stringifyArray(dora_indicators));
		
		if (!closed_tiles.every(tile => tile.rank != Rank.Back))
			throw new InvalidHandAndTilesError("Closed tiles/Winning tile cannot contain tile backs! Tile backs are reserved for closed kans (classified as an open group as the tiles cannot be grouped in any other way as they might be in a closed hand).");

		const non_openTiles: Tile[] = [...closed_tiles, ...dora_indicators];

		let handCount: number = 14;
		open_tiles.forEach((group, i) =>
		{
			if (!Tile.isMeld(group))
				throw new InvalidHandAndTilesError("Open groups must be melds");

			if (group.length == 4)
			{
				// make sure that all other open tiles do not contain this tile
				if (open_tiles.slice(i + 1).some(g => g.some(t => t.softEquals(group[0]))) || 
					open_tiles.slice(0, i).some(g => g.some(t => t.softEquals(group[0]))))
					throw new InvalidHandAndTilesError("Found 5 of the same tile on the table! 4 in a kan, and 1 in an open group");
				if (closed_tiles.some(t => t.softEquals(group[0])))
					throw new InvalidHandAndTilesError("Found 5 of the same tile on the table! 4 in a kan, and 1 in closed tiles");
				if (dora_indicators.some(t => t.softEquals(group[0])))
					throw new InvalidHandAndTilesError("Found 5 of the same tile on the table! 4 in a kan, and 1 in the dora tiles");
			}

			handCount -= 3;
		});

		const allReveledTiles = non_openTiles.concat(...open_tiles);
		if (Tile.hasQuintuplet(allReveledTiles))
			throw new InvalidHandAndTilesError("There are five or more copies of a single tile showing in the dora indicators / hand!");

		handCount -= closed_tiles.length;

		if (handCount < 0)
		{
			throw new InvalidHandAndTilesError("The hand has too many tiles, with " + (-handCount) + " extra tiles! " + closed_tiles.length + " closed tiles, " + open_tiles.flat().length + " open tiles. (" + dora_indicators.length + " dora indicators)");
		}
		else if (handCount > 0)
		{
			throw new InvalidHandAndTilesError("The hand has too few tiles, with " + handCount + " tiles missing! " + closed_tiles.length + " closed tiles, " + open_tiles.flat().length + " open tiles. (" + dora_indicators.length + " dora indicators)");
		}

		// Check to make sure that only one of each red five is present
		const redFives: Tile[] = allReveledTiles.filter(t => t.isRed);
		if (redFives.length > 1)
		{
			let bamboo = false, circle = false, character = false;
			for (let tile of redFives)
			{
				if (tile.suit == Suit.Bamboo && !bamboo)
					bamboo = true;
				else if (tile.suit == Suit.Dot && !circle)
					circle = true;
				else if (tile.suit == Suit.Character && !character)
					character = true;
				else
					throw new InvalidHandAndTilesError("There are multiple red fives of the same suit! All red fives: " + Tile.stringifyArray(redFives));
			}
		}

	}

	public scoreHand(winningTile: Tile, doraIndicators: Tile[], tsumo: boolean, prevalentWind: Rank, playerWind: Rank, riichi: boolean, doubleRiichi: boolean, ippatsu: boolean, kan_win: boolean, last_draw_win: boolean):
	{
		winnings: number;
		title: string;
		payOrder: string;
		wins: Win[];
		groups: Tile[][];
	} {
		console.log("Hand: { closing_tiles: " + Tile.stringifyArray(this.closedTiles) + ", open_groups: " + Tile.stringifyGroups(this.openGroups) + " }");
		console.log("Scoring hand with winning tile " + winningTile.shortStringify() + " and dora indicators " + Tile.stringifyArray(doraIndicators) + " and tsumo " + tsumo + " and prevalent wind " + prevalentWind + " and player wind " + playerWind + " and riichi " + riichi + " and double riichi " + doubleRiichi + " and ippatsu " + ippatsu + " and kan win " + kan_win + " and last draw win " + last_draw_win);
		if (!this.isClosed() && riichi)
			throw new InvalidScoreArgumentsError("Cannot riichi on a non-closed hand");

		if (doubleRiichi && !riichi)
			throw new InvalidScoreArgumentsError("Cannot have double riichi without riichi");

		if (ippatsu && !riichi)
			throw new InvalidScoreArgumentsError("Cannot have ippatsu without riichi");
		
		if (!Rank.isWind(prevalentWind))
			throw new InvalidScoreArgumentsError("Prevalent wind is not a wind tile");
		
		if (!Rank.isWind(playerWind))
			throw new InvalidScoreArgumentsError("Player wind is not a wind tile");

		Hand.ValidateHandAndTiles([...this.closedTiles, winningTile], this.openGroups, doraIndicators);

		const closed_groups: Tile[][] = HandGrouper.CreateClosedGroups([...this.closedTiles, winningTile]);
		const all_groups: Tile[][] = [...this.openGroups, ...closed_groups];
		const all_tiles = all_groups.flat();
		const sequences = all_groups.filter(g => g.length == 3 && Tile.isSequence(g));

		console.log("Closed Groups: " + Tile.stringifyGroups(closed_groups));

		let wins: Win[] = [];

		// Check for Riichi/Riichi Doubles/Ippatsu
		if (riichi)
		{
			if (doubleRiichi) wins.push(WinCatalog.Double_Riichi);
			else wins.push(WinCatalog.Riichi);
		}

		// Check for Ippatsu (note that riichi must be true which is checked above)
		if (ippatsu) wins.push(WinCatalog.Ippatsu);

		// Check for Menzenchin Tsumo
		if (tsumo && this.isClosed())
		{
			wins.push(WinCatalog.Menzenchin_Tsumo);
		}

		// Check for Under the Sea/River
		if (last_draw_win)
		{
			if (tsumo) wins.push(WinCatalog.Under_The_Sea);
			else wins.push(WinCatalog.Under_The_River);
		}

		// Check for After/Robbing Kan
		if (kan_win)
		{
			if (tsumo) wins.push(WinCatalog.Rinshan_Kaihou);
			else wins.push(WinCatalog.Robbing_A_Kan);
		}

		// Check for seven pairs
		if (closed_groups.length == 7)
		{
			wins.push(WinCatalog.Seven_Pairs);
		}

		// Check for thirteen orphans
		if (closed_groups.length == 13)
		{
			wins.push(WinCatalog.Thirteen_Orphans);
		}

		// Check for pinfu. Note that all groups must be straights, therefore, all in closed.
		if (this.isClosed() && closed_groups.length == 5)
		{
			if (closed_groups.reduce((isPinfu: boolean, meld: Tile[]) =>
			{
				if (!isPinfu) return false; // If we've already found a non-straight, return false
				if (meld.length != 3) return true; // skip pair
				if (!Tile.isSequence(meld)) return false; // must be a sequence

				let winIndex = meld.findIndex(t => t.softEquals(winningTile));
				if (winIndex == -1) return true;
				return meld[winIndex + 1 % 3].rank > Rank.One &&
					meld[winIndex + 1 % 3].rank < Rank.Nine &&
					meld[winIndex + 2 % 3].rank > Rank.One &&
					meld[winIndex + 2 % 3].rank < Rank.Nine &&
					(Rank.getCyclicNext(meld[winIndex + 1 % 3].rank) == meld[winIndex + 2 % 3].rank ||
						Rank.getCyclicNext(meld[winIndex + 2 % 3].rank) == meld[winIndex + 1 % 3].rank);
			}, true))
			{
				wins.push(WinCatalog.Pinfu);
			}
		}

		// Check for Pure Double Sequence
		if (this.isClosed() && closed_groups.length == 5)
		{
			let pure_double_count = 0;

			for (let i = 0; i < sequences.length - 1; i++)
			{
				// if this sequence contains the same tiles as another
				for (let j = i + 1; j < sequences.length; j++)
				{
					if (sequences[i].every(t => sequences[j].findIndex(t2 => t2.softEquals(t)) != -1))
						pure_double_count++;
				}
			}

			if (pure_double_count == 1) wins.push(WinCatalog.Pure_Double_Sequence);
			else if (pure_double_count == 2) wins.push(WinCatalog.Twice_Pure_Double_Sequence);
			else if ( pure_double_count > 2) throw new InvalidScoreArgumentsError("There are more than two pure double sequences in the hand! This means that there were three triplets that were grouped as runs and not triplets!");
		}

		// Check for Yakuhai
		if (all_groups.length == 5)
		{
			const [dragons, winds] = all_groups.filter(g => g.length >= 3 && g[0].suit == Suit.Honor).reduce((acc: [number, number], g: Tile[]) =>
			{
				if (Rank.isDragon(g[0].rank))
				{
					wins.push(WinCatalog.Yakuhai_Dragons);
					acc[0]++;
				}
				else
				{
					if (g[0].rank == prevalentWind) wins.push(WinCatalog.Prevalent_Wind);
					else if (g[0].rank == playerWind) wins.push(WinCatalog.Seat_Wind);

					acc[1]++;
				}
				return acc;
			}, [0, 0]);

			if (dragons == 2) wins.push(WinCatalog.Little_Three_Dragons);
			else if (dragons == 3) wins.push(WinCatalog.Big_Three_Dragons);
			if (winds == 3) wins.push(WinCatalog.Little_Four_Winds);
			else if (winds == 34) wins.push(WinCatalog.Big_Four_Winds);
		}

		// Mixed Trip Seq/Full Sequence
		if (all_groups.length == 5 && sequences.length >= 3)
		{
			const lowest_ranks = sequences.map(s => s.reduce((min: Rank, t: Tile) => t.rank < min ? t.rank : min, Rank.Back));
		
			for (let i = 0; i < lowest_ranks.length - 2; i++)
			{
				for (let j = i + 1; j < lowest_ranks.length - 1; j++)
				{
					for (let k = j + 1; k < lowest_ranks.length; k++)
					{
						if (lowest_ranks[i] == lowest_ranks[j] && lowest_ranks[j] == lowest_ranks[k])
						{
							wins.push(WinCatalog.Mixed_Triple_Sequence);
							break;
						}

						// If the ranks are 1, 4, and 7 and all are the same suit
						if (sequences[i][0].suit == sequences[j][0].suit && sequences[j][0].suit == sequences[k][0].suit && (
							(lowest_ranks[i] == Rank.One && lowest_ranks[j] == Rank.Four && lowest_ranks[k] == Rank.Seven) ||
							(lowest_ranks[i] == Rank.Four && lowest_ranks[j] == Rank.Seven && lowest_ranks[k] == Rank.One) ||
							(lowest_ranks[i] == Rank.Seven && lowest_ranks[j] == Rank.One && lowest_ranks[k] == Rank.Four)
						))
						{
							wins.push(WinCatalog.Pure_Straight);
							break;
						}
					}
				}
			}
		}
		
		// Simples
		if (all_groups.length == 5 && all_tiles.every(t => Rank.isSimple(t.rank)))
		{
			wins.push(WinCatalog.All_Simples);
		}

		// All Honors
		if (all_groups.length == 5 && all_tiles.every(t => Rank.isHonor(t.rank)))
		{
			wins.push(WinCatalog.All_Honors);
		}

		// All Terminals
		if (all_groups.length == 5 && all_tiles.every(t => Rank.isTerminal(t.rank)))
		{
			wins.push(WinCatalog.All_Terminals);
		}

		// Half Outside
		if (all_groups.length == 5 && all_groups.every(g => g.findIndex(t => Rank.isTerminal(t.rank) || Rank.isHonor(t.rank)) != -1))
		{
			wins.push(WinCatalog.Half_Outside_Hand);
		}

		// Full Outside
		if (all_groups.length == 5 && all_tiles.every(t => Rank.isTerminal(t.rank) || Rank.isHonor(t.rank)))
		{
			wins.push(WinCatalog.Full_Outside_Hand);
		}

		// All Triplets (not concealed)
		if (!this.isClosed() && all_groups.filter(g => !Tile.isSequence(g)).length == 4)
		{
			wins.push(WinCatalog.All_Triplets);
		}

		// Concealed Tuplets
		if (sequences.length <= 1) // Optimization check
		{
			const concealed_tuplets = closed_groups.filter(g => !Tile.isSequence(g) && g.length == 3 && (tsumo || g.every(t => !t.softEquals(winningTile)))).concat(this.openGroups.filter(g => g.length == 4 && g.filter(t => t.rank == Rank.Back).length == 2));

			if (concealed_tuplets.length == 4)
				if (concealed_tuplets.every(g => g.every(t => !t.softEquals(winningTile))))
					wins.push(WinCatalog.Single_Wait_Four_Concealed_Triplets);
				else
					wins.push(WinCatalog.Four_Concealed_Triplets);
			else if (concealed_tuplets.length == 3)
				wins.push(WinCatalog.Three_Concealed_Triplets);
		}

		// Kans
		if (sequences.length <= 1) // Optimization check
		{
			const kans = all_groups.filter(g => g.length == 4);

			if (kans.length == 4)
				wins.push(WinCatalog.Four_Kans);
			else if (kans.length == 3)
				wins.push(WinCatalog.Three_Kans);
		}

		// Sequential Triplets
		if (sequences.length <= 1) // Optimization check
		{
			const tuplets = all_groups.filter(g => !Tile.isSequence(g));
			const lowest_ranks = tuplets.map(t => t.reduce((min: Rank, t: Tile) => t.rank < min ? t.rank : min, Rank.One));

			for (let i = 0; i < lowest_ranks.length - 2; i++)
			{
				for (let j = i + 1; j < lowest_ranks.length - 1; j++)
				{
					for (let k = j + 1; k < lowest_ranks.length; k++)
					{
						if ((lowest_ranks[i] + 1 == lowest_ranks[j] && lowest_ranks[j] + 1 == lowest_ranks[k]) ||
							(lowest_ranks[j] + 1 == lowest_ranks[k] && lowest_ranks[i] + 1 == lowest_ranks[k]) ||
							(lowest_ranks[i] + 1 == lowest_ranks[k] && lowest_ranks[j] + 1 == lowest_ranks[k]))
						{
							wins.push(WinCatalog.Triple_Triplets);
							break;
						}
					}
				}
			}
		}

		// All Green
		if (all_tiles.every(t => t.isGreen()))
		{
			wins.push(WinCatalog.All_Green);
		}

		// Half Flush
		const suits = new Set(all_tiles.map(t => t.suit));
		if (all_groups.length == 5 && ((suits.size == 2 && suits.has(Suit.Honor)) || (suits.size == 3 && suits.has(Suit.Honor) && suits.has(Suit.Back))))
		{
			wins.push(WinCatalog.Half_Flush);
		}

		// Full Flush and Nine Gates
		if (all_groups.length == 5 && ((suits.size == 2 && suits.has(Suit.Back) && !suits.has(Suit.Honor)) || suits.size == 1))
		{
			if (this.isClosed())
			{
				const nineGatesTrueHand = [Rank.One, Rank.One, Rank.One, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Nine, Rank.Nine];
				this.closedTiles.forEach(t =>
				{
					let index = nineGatesTrueHand.indexOf(t.rank);
					if (index != -1)
						nineGatesTrueHand.splice(index, 1);
				});

				if (nineGatesTrueHand.length == 0)
					wins.push(WinCatalog.True_Nine_Gates);
				else if (nineGatesTrueHand.length == 1 && nineGatesTrueHand[0] == winningTile.rank)
				{
					wins.push(WinCatalog.Nine_Gates);
				}
				else wins.push(WinCatalog.Full_Flush);
			}
			else wins.push(WinCatalog.Full_Flush);
		}

		if (wins.length == 0)
		{
			return {
				payOrder: "no pay",
				wins: [],
				groups: all_groups,
				title: "No Win! There is no base win in this hand.",
				winnings: 0
			}
		}

		doraIndicators.forEach(dora =>
		{
			const next = Rank.getCyclicNext(dora.rank);
			all_tiles.forEach(t =>
			{
				if (t.rank == next && t.suit == dora.suit)
					wins.push(WinCatalog.Dora_Indicator);
			});
		});

		let baseWinnings = 0;
		let winTitle = "";

		if (wins.findIndex(w => w.yaakuman == Yaakuman.Double) != -1)
		{
			baseWinnings = 16_000;
			winTitle = "Double Yaakuman";
		}
		else if (wins.findIndex(w => w.yaakuman == Yaakuman.Single) != -1)
		{
			baseWinnings = 8_000;
			winTitle = "Yaakuman";
		}
		else
		{
			const han = this.isClosed() ?
				wins.reduce((sum, w) =>
				{
					if (w.closed_han) return sum + w.closed_han;
					else throw new Error("There is a closed hand win without closed_han");
				}, 0) :
				wins.reduce((sum, w) =>
				{
					if (w.open_han) return sum + w.open_han;
					else throw new Error("There is an open hand win without open_han");
				}, 0);
			
			if (han >= 5) switch (han)
			{
				case 5: baseWinnings = 2_000; winTitle = "Mangan"; break;
				case 6:
				case 7: baseWinnings = 3_000; winTitle = "Haneman"; break;
				case 8:
				case 9:
				case 10: baseWinnings = 4_000; winTitle = "Baiman"; break;
				case 11:
				case 12: baseWinnings = 6_000; winTitle = "Sanbaiman"; break;
				default: baseWinnings = 8_000; winTitle = "Kazoe Yaakuman"; break;
			}
			// Calculate fu
			else
			{
				if (closed_groups.length == 7)
				{
					baseWinnings = 25;
					winTitle = "7Pairs (25)";
				}
				else
				{
					baseWinnings = 20;
					const titles: string[] = [];
					if (this.isClosed() && !tsumo)
					{
						baseWinnings += 10;
						titles.push("Menzen-Kafu (10)");
					}

					// tsumo can only be given on pinfu open (no pinfu for open tho )
					if (tsumo && wins.findIndex(w => w == WinCatalog.Pinfu) == 1)
					{
						baseWinnings += 2;
						titles.push("Tsumo (2)");
					}

					for (const g of all_groups)
					{
						let points = 0;
						let title = "";
						if (Tile.isTriplet(g))
						{
							points = 2;
							title = "Triplet";
						}
						else if (Tile.isKan(g))
						{
							points = 8;
							title = "Kan";
						}
						else continue;

						if (Rank.isTerminal(g[0].rank))
						{
							points *= 2;
							title = "Terminal " + title;
						}
						else if (Rank.isHonor(g[0].rank))
						{
							points *= 2;
							title = "Honor " + title;
						}

						if (this.closedTiles.findIndex(t => t.softEquals(g[0])) != -1 || this.openGroups.findIndex(g => g.findIndex(t => t.softEquals(g[0])) != -1 && g.filter(t => t.rank == Rank.Back).length == 2) != -1)
						{
							points *= 2;
							title = "Closed " + title;
						}

						baseWinnings += points;
						titles.push(title + " (" + points + ")");
					}
					
					let singleWait = false;
					const pair = closed_groups.find(g => g.length == 2) ?? [];
					singleWait = (pair != undefined && pair[0].softEquals(winningTile));
					
					if (!singleWait)
					{
						for (const g of all_groups)
						{
							let windex
							if ((windex = g.findIndex(t => t.softEquals(winningTile))) != -1)
							{
								if (!Tile.isSequence(g))
								{
									singleWait = true;
									break;
								}
								else if (g[windex + 1 % 3].rank + 1 != g[windex].rank && g[windex - 1 % 3].rank - 1 != g[windex].rank)
								{
									singleWait = true;
									break;
								}
							}
						}
					}

					if (singleWait)
					{
						baseWinnings += 2;
						titles.push("Single Wait (2)");
					}

					if (Rank.isDragon(pair[0].rank) || pair[0].rank == playerWind || pair[0].rank == prevalentWind)
					{
						baseWinnings += 2;
						titles.push("Yakuhai Pair (2)");
					}

					if (baseWinnings == 20 && !this.isClosed())
					{
						baseWinnings += 2;
						titles.push("Open Pinfu (2)");
					}

					baseWinnings = Math.ceil(baseWinnings / 10) * 10;
					winTitle = titles.join(", ");

				}

				baseWinnings = baseWinnings * Math.pow(2, 2 + han);

				if (baseWinnings > 2_000)
				{
					baseWinnings = 2_000;
					winTitle = "Mangan!: " + winTitle;
				}
			}
		}

		console.log("Winning: " + winTitle + " (" + baseWinnings + ")", "info");

		let payOrder = "";
		const round100 = (num: number) => Math.ceil(num / 100) * 100;

		if (tsumo)
		{
			if (playerWind == prevalentWind)
			{
				payOrder = `Each player pays ${round100(baseWinnings * 2)} for ${round100(baseWinnings * 2 * 3)} in total.`;
			}
			else
			{
				payOrder = `The dealer (${Rank[prevalentWind]}) pays ${round100(baseWinnings * 2)} and other players pay ${round100(baseWinnings)} for ${round100(baseWinnings * 2 * 2)} in total.`;
			}
		}
		else if (playerWind == prevalentWind)
		{
			payOrder = `Losing player pays ${round100(baseWinnings * 6)}.`;
		} else
		{
			payOrder = `Losing player pays ${round100(baseWinnings * 4)}.`;
		}

		return {
			winnings: baseWinnings,
			title: winTitle,
			payOrder: payOrder,
			wins: wins,
			groups: all_groups,
		};
	}
}


namespace HandGrouper
{
	function GetSevenPairs(tiles: Tile[]): Tile[][] | null
	{
		if (tiles.length != 14)
			return null;
		
		let pairs: [number, number][] = [];

		for (let i = 0; i < tiles.length; i++)
		{
			for (let j = i + 1; j < tiles.length; j++)
			{
				if (pairs.findIndex(p => p[1] == i || p[1] == j) != -1)
					continue;

				if (tiles[i].softEquals(tiles[j]))
				{
					pairs.push([i, j]);
					break;
				}
			}
		}

		if (pairs.length != 7)
			return null;

		return pairs.map(p => [tiles[p[0]], tiles[p[1]]]);
	}

	function GetThirteenOrphans(tiles: Tile[]): Tile[][] | null
	{
		if (tiles.length != 14)
			return null;
		
		// Check if all tiles are in the thirteen orphans set
		for (let i = 0; i < tiles.length; i++)
		{
			if (tiles[i].suit == Suit.Honor) continue;
			else if (tiles[i].rank == Rank.One || tiles[i].rank == Rank.Nine) continue;
			else return null;
		}
		
		let orphans: Tile[][] = [];

		for (let i = 0; i < tiles.length; i++)
		{
			let index = orphans.findIndex(g => g[0].softEquals(tiles[i]));
			if (index != -1)
			{
				orphans[index].push(tiles[i]);
			}
			else
			{
				orphans.push([tiles[i]]);
			}
		}

		if (orphans.length == 14)
			throw new Error("Tile.isThirteenOrphans(): 14 orphans found! This should not be possible.");

		if (orphans.length == 13)
		{
			return orphans;
		}
		else return null;
	}

	export function CreateClosedGroups(closed_tiles: Tile[]): Tile[][]
	{
		let specialGroup: Tile[][] | null;

		specialGroup = GetSevenPairs(closed_tiles);
		if (specialGroup != null)
		{
			return specialGroup;
		}

		specialGroup = GetThirteenOrphans(closed_tiles);
		if (specialGroup != null)
		{
			return specialGroup;
		}

		const closed_groups: Tile[][] = [];

		let throwError = (str: string) => { throw new InvalidClosedHandError(str + ": Found => " + Tile.stringifyGroups(closed_groups) + ", invalid => " + Tile.stringifyArray(closed_tiles)); }; 

		let created_pair: boolean = false;
		let sorted = false;
		let loop_count = 0;
		while (closed_tiles.length > 0)
		{
			loop_count++;
			if (loop_count > 10) throwError("Loop count broke!");
			switch (closed_tiles.length)
			{
				case 1:
					throwError("Cannot have a single tile left over when creating closed groups");
					break;

				case 2:
					if (Tile.isPair(closed_tiles))
						closed_groups.push(closed_tiles.splice(0, 2));
					else throwError("Cannot have a single tile left over when creating closed groups");
					break;

				case 3:
					if (Tile.isMeld(closed_tiles))
						closed_groups.push(closed_tiles.splice(0, 3));
					else throwError("Bad meld while creating closed groups");
					break;

				case 4:
				case 7:
				case 10:
				case 13:
					throwError(`Cannot (ever) create groups from ${closed_tiles.length} tiles when creating closed groups (needs to be multiple of 3 with pair)`);
					break;

				case 5:
					// There must be one meld and one pair. Remove the meld.
				case 6:
				case 9:
				case 12:

					if (!sorted)
					{
						closed_tiles.sort((a, b) => a.rank - b.rank);
						sorted = true;
					}
					// Must be all melds. These melds are assumed to only have one valid combination in a valid hand, so find one of the melds here, and let the while loop find the other (case 6/9 and case 3).
					let foundMeld = FindAnyMeld(closed_tiles);

					if (foundMeld == null)
						throwError(`Could not find ANY melds while creating closed groups from the last ${closed_tiles.length} tiles (which must have at least one meld)`);
					else
					{
						closed_groups.push([closed_tiles[foundMeld[0]], closed_tiles[foundMeld[1]], closed_tiles[foundMeld[2]]]);
						closed_tiles.splice(foundMeld[2], 1);
						closed_tiles.splice(foundMeld[1], 1);
						closed_tiles.splice(foundMeld[0], 1);
					}
					break;

				case 8:
				case 11:
				case 14:
					if (created_pair)
						throwError(`Cannot create groups from ${closed_tiles.length} tiles because pair was already made when creating closed groups`);
					
					// First, find any triplets that cannot be a sequence
					const triplet = FindNonSequenceTriplet(closed_tiles);
					if (triplet != null)
					{
						closed_groups.push([closed_tiles[triplet[0]], closed_tiles[triplet[1]], closed_tiles[triplet[2]]]);
						closed_tiles.splice(triplet[2], 1);
						closed_tiles.splice(triplet[1], 1);
						closed_tiles.splice(triplet[0], 1);
						break;
					}

					// Find a pair that keeps the hand valid (only one pair if there is a pair with no meld options)
					const pairs: [number, number][] = FindBestValidPairs(closed_tiles);

					if (pairs.length <= 0)
						throwError(`Could not find a pair while creating closed groups from the last ${closed_tiles.length} tiles (which must have a pair)`);
					else if (pairs.length == 1)
					{
						closed_groups.push([closed_tiles[pairs[0][0]], closed_tiles[pairs[0][1]]]);
						closed_tiles.splice(pairs[0][1], 1);
						closed_tiles.splice(pairs[0][0], 1);
						created_pair = true;
					}
					else if (pairs.length > 1)
					{
						throwError(`Non-Implement! ${closed_tiles.length} tiles left and there are multiple pairs that can be melded in different ways. Pairs: [${Tile.stringifyGroups(pairs.map(x => [closed_tiles[x[0]], closed_tiles[x[1]]]))}]. Groups`);
					}
					break;

				default:
					throwError("Closed tiles is higher than 14!");
			}
		}

		return closed_groups;
	}


	function FindNonSequenceTriplet(closed_tiles: Tile[]): [number, number, number] | null
	{
		for (let i = 0; i < closed_tiles.length - 2; i++)
		{
			for (let j = i + 1; j < closed_tiles.length - 1; j++)
			{
				for (let k = j + 1; k < closed_tiles.length; k++)
				{
					if (Tile.isTriplet([closed_tiles[i], closed_tiles[j], closed_tiles[k]]))
					{
						let sequ = false;
						if (closed_tiles[i].suit != Suit.Honor)
						{
							
							for (let x = 0; x < closed_tiles.length - 1 && !sequ; x++)
							{
								if (x != i && x != j && x != k)
									for (let y = x + 1; y < closed_tiles.length && !sequ; y++)
									{
										if (y != i && y != j && y != k)
											if (Tile.isSequence([closed_tiles[i], closed_tiles[x], closed_tiles[y]]))
												sequ = true;
									}
							}
						}
						if (!sequ)
							return [i, j, k]
					}
				}
			}
		}

		return null;
	}

	function FindAnyMeld(closed_tiles: Tile[]): [number, number, number] | null
	{
		// Find triplets first
		for (let i = 0; i < closed_tiles.length - 2; i++)
		{
			for (let j = i + 1; j < closed_tiles.length - 1; j++)
			{
				for (let k = j + 1; k < closed_tiles.length; k++)
				{
					if (Tile.isTriplet([closed_tiles[i], closed_tiles[j], closed_tiles[k]]))
					{
						return [i, j, k];
					}
				}
			}
		}

		// Find sequences second
		for (let i = 0; i < closed_tiles.length - 2; i++)
		{
			for (let j = i + 1; j < closed_tiles.length - 1; j++)
			{
				for (let k = j + 1; k < closed_tiles.length; k++)
				{
					if (Tile.isSequence([closed_tiles[i], closed_tiles[j], closed_tiles[k]]))
					{
						return [i, j, k];
					}
				}
			}
		}

		return null;
	}

	function FindBestValidPairs(closed_tiles: Tile[]): [number, number][]
	{
		const pairs: [number, number][] = [];
		for (let i = 0; i < closed_tiles.length - 1; i++)
		{
			for (let j = i + 1; j < closed_tiles.length; j++)
			{
				if (pairs.findIndex((y) => closed_tiles[y[1]].softEquals(closed_tiles[i]) || closed_tiles[y[1]].softEquals(closed_tiles[j])) >= 0)
					continue; // If already used in a pair, skip

				if (closed_tiles[i].softEquals(closed_tiles[j]))
				{
					let canMeldI: boolean = false;
					let canMeldJ: boolean = false;
					for (let k = 0; k < closed_tiles.length - 1; k++)
					{
						for (let l = k + 1; l < closed_tiles.length; l++)
						{
							if (!canMeldI && k != i && l != i && Tile.isMeld([closed_tiles[i], closed_tiles[k], closed_tiles[l]]))
							{
								canMeldI = true;
							}

							if (!canMeldJ && k != j && l != j && Tile.isMeld([closed_tiles[j], closed_tiles[k], closed_tiles[l]]))
							{
								canMeldJ = true;
							}
						}
					}

					// If either of the tiles in a pair cannot be melded, than it must be the pair in a valid hand
					if (canMeldI == false || canMeldJ == false)
					{
						return [[i, j]];
					}
					else pairs.push([i, j]);
				}
			}
		}

		return pairs;
	}
}


export class Evaluator
{

}