import { InvalidHandAndTilesError, InvalidScoreArgumentsError, Rank, Suit, Tile, Win, Yaakuman, TileGroup, TileGroupType } from "./MahjongDataTypes";
import { WinCatalog } from "./WinCatalog";

const round100 = (num: number) => Math.ceil(num / 100) * 100;

export class PlayerBoard
{
	private _allTilesInPlay?: readonly Tile[];
	public get allTilesInPlay(): readonly Tile[]
	{
		return this._allTilesInPlay ?? (this._allTilesInPlay =
			this.allHandTiles
				.concat(this.doraIndicators)
				.concat(this.discards)
		);
	}
	private clearAllTilesInPlay()
	{
		this._allTilesInPlay = undefined;

		this._validFlippedTiles = false;
		this._validBoard = false;
	}

	private _allHandTiles?: readonly Tile[];
	public get allHandTiles()
	{
		return this._allHandTiles ?? (this._allHandTiles =
			this.allHandGroups.flatMap(g => g.tiles)
		);
	}
	private clearAllHandTiles()
	{
		this._allHandTiles = undefined;
		this.clearAllTilesInPlay();
		this.clearSuitBasedWins();
		this.clearSuitsInHand();
		this.clearRedFives();

		this._validHandSize = false;
	}

	private _allHandGroups?: readonly TileGroup[];
	public get allHandGroups(): readonly TileGroup[]
	{
		if (this._allHandGroups) return this._allHandGroups;
		if (this.winningTile == null) return [];

		this._allHandGroups = HandGrouper.CreateClosedGroups([...this.hiddenHandTiles, this.winningTile]);

		this._allHandGroups = this._allHandGroups.concat(this._visibleHandGroups);
		return this._allHandGroups;
	}
	private clearAllHandGroups()
	{
		this._allHandGroups = undefined;
		this.clearAllHandTiles();
		this.clearClosedGroups();
		this.clearOpenGroups();
		this.clearTripletGroups();
		this.clearKanGroups();
		this.clearTupletGroups();
		this.clearHasAllTripletsWin();
		this.clearSequenceGroups();
		this.clearPairGroup();
		this.clearWinningTileGroup();
		this._validGroups = false;
	}

	private _closedTiles?: readonly Tile[];
	public get closedTiles(): readonly Tile[]
	{
		return this._closedTiles ?? (this._closedTiles =
			this.closedGroups.flatMap(g => g.tiles)
		);
	}
	private clearClosedTiles()
	{
		this._closedTiles = undefined;
	}

	private _openTiles?: readonly Tile[];
	public get openTiles()
	{
		return this._openTiles ?? (this._openTiles =
			this.openGroups.flatMap(g => g.tiles)
		);
	}
	private clearOpenTiles()
	{
		this._openTiles = undefined;
	}

	private _closedGroups?: readonly TileGroup[];
	public get closedGroups()
	{
		return this._closedGroups ?? (this._closedGroups = this.allHandGroups.filter(g => g.closed));
	}
	private clearClosedGroups()
	{
		this._closedGroups = undefined;
		this.clearClosedHand();
		this.clearClosedTiles();
		this.clearHasSevenPairsWin();
		this.clearHasThirteenOrphansWin();
	}

	private _openGroups?: readonly TileGroup[];
	public get openGroups(): readonly TileGroup[]
	{
		return this._openGroups ?? (this._openGroups = this.allHandGroups.filter(g => !g.closed));
	}
	private clearOpenGroups()
	{
		this._openGroups = undefined;
		this.clearOpenTiles();
		this.clearClosedHand();
	}

	private _sequenceGroups?: readonly TileGroup[];
	public get sequenceGroups(): readonly TileGroup[]
	{
		return this._sequenceGroups ?? (this._sequenceGroups =
			this.allHandGroups.filter(g => g.type === TileGroupType.Sequence)
		);
	}
	private clearSequenceGroups()
	{
		this._sequenceGroups = undefined;

		this.clearIsPinfuHand();
		this.clearPureDoubleSequenceCount();
		this.clearHasMixedTripleSequenceWin();
		this.clearHasPureStraightWin();
	}

	private _pairGroup?: TileGroup | null;
	public get pairGroup(): TileGroup | null
	{
		return this._pairGroup ?? (this._pairGroup =
			(this.allHandGroups.find(g => g.type === TileGroupType.Pair) ?? null)
		);
	}
	private clearPairGroup()
	{
		this._pairGroup = undefined;
	}

	private _tripletGroups?: readonly TileGroup[];
	public get tripletGroups(): readonly TileGroup[]
	{
		return this._tripletGroups ?? (this._tripletGroups =
			this.allHandGroups.filter(g => g.type === TileGroupType.Triplet)
		);
	}
	private clearTripletGroups()
	{
		this._tripletGroups = undefined;
	}

	private _kanGroups?: readonly TileGroup[];
	public get kanGroups(): readonly TileGroup[]
	{
		return this._kanGroups ?? (this._kanGroups =
			this.allHandGroups.filter(g => g.type === TileGroupType.Kan)
		);
	}
	private clearKanGroups()
	{
		this._kanGroups = undefined;
		this.clearHasThreeKansWin();
		this.clearHasFourKansWin();

		this._validHandSize = false;
		this._validScoreParameters = false;
	}

	private _dragonGroups?: readonly TileGroup[];
	public get dragonGroups(): readonly TileGroup[]
	{
		return this._dragonGroups ?? (this._dragonGroups =
			this.tupletGroups.filter(group =>
				group.tiles[0].suit == Suit.Honor &&
				Rank.isDragon(group.tiles[0].rank)
			)
		);
	}
	private clearDragonGroups()
	{
		this._dragonGroups = undefined;
		this.clearHasYakuhaiWin();
		this.clearHasLittleThreeDragonsWin();
		this.clearHasBigThreeDragonsWin();
	}

	private _windGroups?: readonly TileGroup[];
	public get windGroups(): readonly TileGroup[]
	{
		return this._windGroups ?? (this._windGroups =
			this.tupletGroups.filter(group =>
				group.tiles[0].suit == Suit.Honor &&
				Rank.isWind(group.tiles[0].rank)
			)
		);
	}
	private clearWindGroups()
	{
		this._windGroups = undefined;

		this.clearHasSeatWindWin();
		this.clearHasPrevalentWindWin();
		this.clearHasLittleFourWindsWin();
		this.clearHasBigFourWindsWin();
	}

	private _tupletGroups?: readonly TileGroup[];
	public get tupletGroups(): readonly TileGroup[]
	{
		return this._tupletGroups ?? (this._tupletGroups =
			this.tripletGroups.concat(this.kanGroups)
		);
	}
	private clearTupletGroups()
	{
		this._tupletGroups = undefined;
		this.clearDragonGroups();
		this.clearWindGroups();
		this.clearConcealedTuplets();
		this.clearHasSequenceTripletsWin();
	}

	private _redFives?: readonly Tile[];
	public get redFives(): readonly Tile[]
	{
		return this._redFives ?? (this._redFives =
			this.allHandTiles.filter(t => t.isRed)
		);
	}
	private clearRedFives() { this._redFives = undefined; }

	private _concealedTuplets?: readonly TileGroup[];
	public get concealedTuplets(): readonly TileGroup[]
	{
		if (this._concealedTuplets) return this._concealedTuplets;

		this._concealedTuplets = this.tupletGroups.filter(g => g.closed);

		if (this.ron)
			this._concealedTuplets = this._concealedTuplets.filter(g => g == this.winningTileGroup);
		
		return this._concealedTuplets;
	}
	private clearConcealedTuplets()
	{
		this._concealedTuplets = undefined;
		this.clearHasThreeConcealedTripletsWin();
		this.clearHasFourConcealedTripletsWin();
		this.clearHasSingleWaitFourConcealedTripletsWin();
	}

	private _hiddenHandTiles: readonly Tile[] = [];
	public get hiddenHandTiles() { return this._hiddenHandTiles; }
	public set hiddenHandTiles(value: readonly Tile[])
	{
		this._hiddenHandTiles = value;

		this.handChanged();
		this.clearAllHandGroups();
	}

	private _visibleHandTiles: readonly Tile[][] = [];
	private _visibleHandGroups: readonly TileGroup[] = [];
	public get visibleHandTiles() { return this._visibleHandTiles; }
	public set visibleHandTiles(value: readonly Tile[][])
	{
		this._visibleHandTiles = value;
		this._visibleHandGroups = value.map(group => new TileGroup(group, false));

		this.handChanged();
		this.clearAllHandGroups();
	}

	private _winningTile: Tile | null = null;
	public get winningTile(): Tile | null { return this._winningTile; }
	public set winningTile(value: Tile | null)
	{
		this._winningTile = value;

		this.handChanged();
		this.clearAllHandGroups();
	}

	private _winningTileGroup?: TileGroup | null;
	public get winningTileGroup(): TileGroup | null
	{
		if (this._winningTileGroup !== undefined) return this._winningTileGroup;

		return this._winningTileGroup = this.allHandGroups.find(g => g.tiles.includes(this.winningTile!)) ?? null;
	}
	private clearWinningTileGroup()
	{
		this._winningTileGroup = undefined;
	}

	private _doraIndicators: readonly Tile[] = [];
	public get doraIndicators(): readonly Tile[] { return this._doraIndicators; }
	public set doraIndicators(value: readonly Tile[])
	{
		this._doraIndicators = value;

		this.handChanged();
		this.clearAllTilesInPlay();
	}

	private _discards: readonly Tile[] = [];
	public get discards(): readonly Tile[] { return this._discards; }
	public set discards(value: readonly Tile[])
	{
		this._discards = value;

		this.handChanged();
		this.clearAllTilesInPlay();
	}

	private _seatWind: Rank = Rank.EastWind;
	public get seatWind(): Rank { return this._seatWind; }
	public set seatWind(value: Rank)
	{
		if (this._seatWind === value) return;

		this._seatWind = value;

		this.handChanged();
		this._validScoreParameters = false;
		this.clearHasSeatWindWin();
	}

	private _prevalentWind: Rank = Rank.EastWind
	public get prevalentWind(): Rank { return this._prevalentWind; }
	public set prevalentWind(value: Rank)
	{
		if (this._prevalentWind == value) return;

		this._prevalentWind = value;

		this.handChanged();
		this._validScoreParameters = false;
		this.clearHasPrevalentWindWin();
	}

	private _tsumo: boolean = false;
	public get tsumo(): boolean { return this._tsumo; }
	public get ron(): boolean { return !this._tsumo; }
	public set tsumo(value: boolean)
	{
		if (this._tsumo == value) return;

		this._tsumo = value;

		this.handChanged();
		this.clearHasMenzenchinTsumoWin();
		this.clearHasUnderTheSeaWin();
		this.clearHasUnderTheRiverWin();
		this.clearHasRinshanKaihouWin();
		this.clearHasRobbingAKanWin();
	}
	public set ron(value: boolean) { this.tsumo = !value; }

	private _riichi: boolean = false;
	public get riichi(): boolean { return this._riichi; }
	public set riichi(value: boolean)
	{
		if (this._riichi == value) return;

		this._riichi = value;

		this._validScoreParameters = false;
		this.clearHasRiichiWin();
		this.clearHasDoubleRiichiWin();
	}

	private _doubleRiichi: boolean = false;
	public get doubleRiichi(): boolean { return this._doubleRiichi; }
	public set doubleRiichi(value: boolean)
	{
		if (this._doubleRiichi == value) return;

		this._doubleRiichi = value;

		this.handChanged();
		this._validScoreParameters = false;
		this.clearHasRiichiWin();
		this.clearHasDoubleRiichiWin();
	}

	private _ippatsu: boolean = false;
	public get ippatsu(): boolean { return this._ippatsu; }
	public set ippatsu(value: boolean)
	{
		if (this._ippatsu == value) return;

		this._ippatsu = value;
		
		this.handChanged();
		this._validScoreParameters = false;
		this.clearHasIppatsuWin();
	}

	private _kanWin: boolean = false;
	public get kanWin(): boolean { return this._kanWin; }
	public set kanWin(value: boolean)
	{
		if (this._kanWin == value) return;

		this._kanWin = value;

		this.handChanged();
		this._validScoreParameters = false;
		this.clearHasRinshanKaihouWin();
		this.clearHasRobbingAKanWin();
	}

	private _lastDrawWin: boolean = false;
	public get lastDrawWin(): boolean { return this._lastDrawWin; }
	public set lastDrawWin(value: boolean)
	{
		if (this._lastDrawWin == value) return;

		this._lastDrawWin = value;
		
		this.handChanged();
		this.clearHasUnderTheSeaWin();
		this.clearHasUnderTheRiverWin();
	}

	private _validHandSize: boolean = false;
	public ValidateHandSize(): boolean
	{
		if (this._validHandSize || (this._validHandSize =
			(this.allHandTiles.length - this.kanGroups.length) === 14
		)) return true;

		let handCount = this.allHandTiles.length - this.kanGroups.length;
		if (handCount > 14)
		{
			throw new InvalidHandAndTilesError("The hand has too many tiles, with " + (handCount - 14) + " extra tiles! " + this.hiddenHandTiles.length + " closed tiles, " + (this.allHandTiles.length - this.hiddenHandTiles.length) + " open tiles. Hand size should be " + (14 + this.kanGroups.length) + " tiles given there " + (this.kanGroups.length === 1 ? "is" : "are") + " " + this.kanGroups.length + " kan group" + (this.kanGroups.length === 1 ? "" : "s") + ".");
		}
		else
		{
			throw new InvalidHandAndTilesError("The hand has too few tiles, with " + (14 - handCount) + " tiles missing! " + this.hiddenHandTiles.length + " closed tiles, " + (this.allHandTiles.length - this.hiddenHandTiles.length) + " open tiles. Hand size should be " + (14 + this.kanGroups.length) + " tiles given there " + (this.kanGroups.length === 1 ? "is" : "are") + " " + this.kanGroups.length + " kan group" + (this.kanGroups.length === 1 ? "" : "s") + ".");
		}
	}

	private _validFlippedTiles: boolean = false;
	/**
	 * Validates that all face-down tiles resolve to a valid tile. All tiles that are included in the board state must be resolvable to a suit and a rank.
	 * @returns True if the boards flipped down tiles are valid, false if it is not.
	 */
	public ValidateFlippedTiles(): boolean
	{
		if (this._validFlippedTiles || (this._validFlippedTiles =
			this.allTilesInPlay.every(t => t.rank != Rank.Back && t.suit != Suit.Back)
		)) return true;

		throw new InvalidHandAndTilesError("Board cannot consist of unknown tile backs! Tile backs are reserved for closed kans (classified as an open group as the tiles cannot be grouped in any other way as they might be in a closed hand).");
	}

	private _validBoard: boolean = false;
	public ValidateBoard()
	{
		if (this._validBoard) return true;

		if (Tile.hasQuintuplet(this.allTilesInPlay))
		{
			throw new InvalidHandAndTilesError("There are five or more copies of a single tile showing in the dora indicators / hand / discard (this may include closed kan)!");
		}

		if (Tile.DoubleRedFives(this.redFives))
		{
			throw new InvalidHandAndTilesError("There are multiple red fives of the same suit! All red fives: " + Tile.stringifyArray(this.allTilesInPlay.filter(t => t.isRed)));
		}

		return this._validBoard = true;
	}

	private _validScoreParameters: boolean = false;
	public ValidateScoreParameters(): boolean
	{
		if (this._validScoreParameters) return true;

		if (this.openHand && this.riichi)
			throw new InvalidScoreArgumentsError("Cannot riichi on a non-closed hand");

		if (this.doubleRiichi && !this.riichi)
			throw new InvalidScoreArgumentsError("Cannot have double riichi without riichi");

		if (this.ippatsu && !this.riichi)
			throw new InvalidScoreArgumentsError("Cannot have ippatsu without riichi");
		
		if (!Rank.isWind(this.prevalentWind))
			throw new InvalidScoreArgumentsError("Prevalent wind is not a wind tile");
		
		if (!Rank.isWind(this.seatWind))
			throw new InvalidScoreArgumentsError("Player wind is not a wind tile");
		
		if (this.kanWin && this.kanGroups.length === 0)
			throw new InvalidScoreArgumentsError("Cannot have kan win without a kan");
		
		return this._validScoreParameters = true;
	}

	private _validGroups: boolean = false;
	public ValidateGroups(): boolean
	{
		if (this._validGroups) return true;
		
		let error_group = this.allHandGroups.find(g => g.type === TileGroupType.Error)

		if (error_group !== undefined)
		{
			throw new InvalidHandAndTilesError("Invalid Tile Group: " + error_group.error!);
		}

		return this._validGroups = true;
	}

	private _closedHand?: boolean;
	public get closedHand(): boolean
	{
		return this._closedHand ?? (this._closedHand = this.openGroups.length === 0);
	}
	public get openHand(): boolean { return !this.closedHand; }
	private clearClosedHand()
	{
		this._closedHand = undefined;

		this._validScoreParameters = false;
		this.clearHasMenzenchinTsumoWin();
		this.clearHasPinfuWin();
		this.clearHasThreeConcealedTripletsWin();
		this.clearHasFourConcealedTripletsWin();
		this.clearHasSingleWaitFourConcealedTripletsWin();
	}


	private _hasRiiichiWin?: boolean;
	public get hasRiichiWin(): boolean
	{
		return this._hasRiiichiWin ?? (this._hasRiiichiWin = this.riichi && !this.doubleRiichi);
	}
	private clearHasRiichiWin() { this._hasRiiichiWin = undefined; }

	private _hasDoubleRiichiWin?: boolean;
	public get hasDoubleRiichiWin(): boolean
	{
		return this._hasDoubleRiichiWin ?? (this._hasDoubleRiichiWin = this.riichi && this.doubleRiichi);
	}
	private clearHasDoubleRiichiWin() { this._hasDoubleRiichiWin = undefined; }

	private _hasIppatsuWin?: boolean;
	public get hasIppatsuWin(): boolean
	{
		return this._hasIppatsuWin ?? (this._hasIppatsuWin = this.ippatsu);
	}
	private clearHasIppatsuWin() { this._hasIppatsuWin = undefined; }

	private _hasMenzenchinTsumoWin?: boolean;
	public get hasMenzenchinTsumoWin(): boolean
	{
		return this._hasMenzenchinTsumoWin ?? (this._hasMenzenchinTsumoWin = this.closedHand && this.tsumo);
	}
	private clearHasMenzenchinTsumoWin() { this._hasMenzenchinTsumoWin = undefined; }

	private _hasUnderTheSeaWin?: boolean;
	public get hasUnderTheSeaWin(): boolean
	{
		return this._hasUnderTheSeaWin ?? (this._hasUnderTheSeaWin = this.lastDrawWin && this.tsumo);
	}
	private clearHasUnderTheSeaWin() { this._hasUnderTheSeaWin = undefined; }

	private _hasUnderTheRiverWin?: boolean;
	public get hasUnderTheRiverWin(): boolean
	{
		return this._hasUnderTheRiverWin ?? (this._hasUnderTheRiverWin = this.lastDrawWin && this.ron);
	}
	private clearHasUnderTheRiverWin() { this._hasUnderTheRiverWin = undefined; }

	private _hasRinshanKaihouWin?: boolean;
	public get hasRinshanKaihouWin(): boolean
	{
		return this._hasRinshanKaihouWin ?? (this._hasRinshanKaihouWin = this.kanWin && this.tsumo);
	}
	private clearHasRinshanKaihouWin() { this._hasRinshanKaihouWin = undefined; }

	private _hasRobbingAKanWin?: boolean;
	public get hasRobbingAKanWin(): boolean
	{
		return this._hasRobbingAKanWin ?? (this._hasRobbingAKanWin = this.kanWin && this.ron);
	}
	private clearHasRobbingAKanWin() { this._hasRobbingAKanWin = undefined; }

	private _hasSevenPairsWin?: boolean;
	public get hasSevenPairsWin(): boolean
	{
		return this._hasSevenPairsWin ?? (this._hasSevenPairsWin = this.closedHand && this.closedGroups.length == 7);
	}
	private clearHasSevenPairsWin() { this._hasSevenPairsWin = undefined; }

	private _hasThirteenOrphansWin?: boolean;
	public get hasThirteenOrphansWin(): boolean
	{
		return this._hasThirteenOrphansWin ?? (this._hasThirteenOrphansWin =
			this.closedHand && this.closedGroups.length === 13 &&
			!this.hasPureThirteenOrphansWin
		);
	}
	private clearHasThirteenOrphansWin() { this._hasThirteenOrphansWin = undefined; }
	
	private _hasPureThirteenOrphansWin?: boolean;
	public get hasPureThirteenOrphansWin(): boolean
	{
		return this._hasPureThirteenOrphansWin ?? (this._hasPureThirteenOrphansWin =
			this.closedHand && this.closedGroups.length === 13 &&
			this.hiddenHandTiles.some(t => this.winningTile?.softEquals(t))
		);
	}


	private _isPinfuHand?: boolean;
	public get isPinfuHand(): boolean
	{
		if (this._isPinfuHand !== undefined) return this._isPinfuHand;

		if (this.sequenceGroups.length != 4 || !this.winningTileGroup || this.winningTileGroup.tiles.length != 3) return this._isPinfuHand = false;

		if (!this.pairGroup || this.pairGroup.tiles[0].suit == Suit.Honor) return this._isPinfuHand = false;

		return this._isPinfuHand =
			this.winningTileGroup.tiles[1] != this.winningTile &&
			(this.winningTileGroup.tiles[0] == this.winningTile || this.winningTileGroup.tiles[0].rank != Rank.One) &&
			(this.winningTileGroup.tiles[2] == this.winningTile || this.winningTileGroup.tiles[2].rank != Rank.Nine);
	}
	private clearIsPinfuHand() { this._isPinfuHand = undefined; this.clearHasPinfuWin(); }

	private _hasPinfuWin?: boolean;
	public get hasPinfuWin(): boolean
	{
		return this._hasPinfuWin ?? (this._hasPinfuWin = this.isPinfuHand && this.closedHand);
	}
	private clearHasPinfuWin() { this._hasPinfuWin = undefined; }

	private _pureDoubleSequenceCount?: number;
	public get pureDoubleSequenceCount(): number
	{
		if (this._pureDoubleSequenceCount !== undefined) return this._pureDoubleSequenceCount;

		let pure_double_count = 0;

		for (let i = 0; i < this.sequenceGroups.length - 1; i++)
		{
			// if this sequence contains the same tiles as another
			for (let j = i + 1; j < this.sequenceGroups.length; j++)
			{
				if (this.sequenceGroups[i].tiles[0].softEquals(this.sequenceGroups[j].tiles[0]))
					pure_double_count++;
			}
		}

		return this._pureDoubleSequenceCount = pure_double_count;
	}
	private clearPureDoubleSequenceCount()
	{
		this._pureDoubleSequenceCount = undefined;
		this._hasPureDoubleSequenceWin = undefined;
		this._hasTwicePureDoubleSequenceWin = undefined;
	}

	private _hasPureDoubleSequenceWin?: boolean;
	public get hasPureDoubleSequenceWin(): boolean
	{
		return this._hasPureDoubleSequenceWin ?? (this._hasPureDoubleSequenceWin =
			this.pureDoubleSequenceCount === 1
		);
	}

	private _hasTwicePureDoubleSequenceWin?: boolean;
	public get hasTwicePureDoubleSequenceWin(): boolean
	{
		return this._hasTwicePureDoubleSequenceWin ?? (this._hasTwicePureDoubleSequenceWin =
			this.pureDoubleSequenceCount === 2
		);
	}

	private _hasGreenDragonYakuhaiWin?: boolean;
	public get hasGreenDragonYakuhaiWin(): boolean
	{
		return this._hasGreenDragonYakuhaiWin ?? (this._hasGreenDragonYakuhaiWin =
			this.dragonGroups.find(group => group.tiles[0].rank == Rank.GreenDragon) !== undefined
		);
	}
	private _hasRedDragonYakuhaiWin?: boolean;
	public get hasRedDragonYakuhaiWin(): boolean
	{
		return this._hasRedDragonYakuhaiWin ?? (this._hasRedDragonYakuhaiWin =
			this.dragonGroups.find(group => group.tiles[0].rank == Rank.RedDragon) !== undefined
		);
	}
	private _hasWhiteDragonYakuhaiWin?: boolean;
	public get hasWhiteDragonYakuhaiWin(): boolean
	{
		return this._hasWhiteDragonYakuhaiWin ?? (this._hasWhiteDragonYakuhaiWin =
			this.dragonGroups.find(group => group.tiles[0].rank == Rank.WhiteDragon) !== undefined
		);
	}
	private clearHasYakuhaiWin()
	{
		this._hasGreenDragonYakuhaiWin = undefined;
		this._hasRedDragonYakuhaiWin = undefined;
		this._hasWhiteDragonYakuhaiWin = undefined;
	}

	private _hasPrevalentWindWin?: boolean;
	public get hasPrevalentWindWin(): boolean
	{
		return this._hasPrevalentWindWin ?? (this._hasPrevalentWindWin =
			this.windGroups.find(group => group.tiles[0].rank == this.prevalentWind) !== undefined
		);
	}
	private clearHasPrevalentWindWin() { this._hasPrevalentWindWin = undefined; }

	private _hasSeatWindWin?: boolean;
	public get hasSeatWindWin(): boolean
	{
		return this._hasSeatWindWin ?? (this._hasSeatWindWin =
			this.windGroups.find(group => group.tiles[0].rank == this.seatWind) !== undefined
		);
	}
	private clearHasSeatWindWin() { this._hasSeatWindWin = undefined; }

	private _hasLittleThreeDragonsWin?: boolean;
	public get hasLittleThreeDragonsWin(): boolean
	{
		return this._hasLittleThreeDragonsWin ?? (this._hasLittleThreeDragonsWin =
			this.dragonGroups.length == 2
		);
	}
	private clearHasLittleThreeDragonsWin() { this._hasLittleThreeDragonsWin = undefined; }

	private _hasBigThreeDragonsWin?: boolean;
	public get hasBigThreeDragonsWin(): boolean
	{
		return this._hasBigThreeDragonsWin ?? (this._hasBigThreeDragonsWin =
			this.dragonGroups.length == 3
		);
	}
	private clearHasBigThreeDragonsWin() { this._hasBigThreeDragonsWin = undefined; }

	private _hasLittleFourWindsWin?: boolean;
	public get hasLittleFourWindsWin(): boolean
	{
		return this._hasLittleFourWindsWin ?? (this._hasLittleFourWindsWin =
			this.windGroups.length == 3
		);
	}
	private clearHasLittleFourWindsWin() { this._hasLittleFourWindsWin = undefined; }

	private _hasBigFourWindsWin?: boolean;
	public get hasBigFourWindsWin(): boolean
	{
		return this._hasBigFourWindsWin ?? (this._hasBigFourWindsWin =
			this.windGroups.length == 4
		);
	}
	private clearHasBigFourWindsWin() { this._hasBigFourWindsWin = undefined; }

	private _hasMixedTripleSequenceWin?: boolean;
	public get hasMixedTripleSequenceWin(): boolean
	{
		if (this._hasMixedTripleSequenceWin !== undefined) return this._hasMixedTripleSequenceWin;

		for (let i = 0; i < this.sequenceGroups.length - 2; i++)
		{
			for (let j = i + 1; j < this.sequenceGroups.length - 1; j++)
			{
				for (let k = j + 1; k < this.sequenceGroups.length; k++)
				{
					if (this.sequenceGroups[i] == this.sequenceGroups[j] &&
						this.sequenceGroups[i] == this.sequenceGroups[k])
						return this._hasMixedTripleSequenceWin = true;
				}
			}
		}

		return this._hasMixedTripleSequenceWin = false;
	}
	private clearHasMixedTripleSequenceWin() { this._hasMixedTripleSequenceWin = undefined; }

	private _hasPureStraightWin?: boolean;
	public get hasPureStraightWin(): boolean
	{
		if (this._hasPureStraightWin !== undefined) return this._hasPureStraightWin;

		for (let i = 0; i < this.sequenceGroups.length - 2; i++)
		{
			for (let j = i + 1; j < this.sequenceGroups.length - 1; j++)
			{
				for (let k = j + 1; k < this.sequenceGroups.length; k++)
				{
					if (this.sequenceGroups[i].tiles[0].suit == this.sequenceGroups[j].tiles[0].suit &&
						this.sequenceGroups[j].tiles[0].suit == this.sequenceGroups[k].tiles[0].suit && (
						(this.sequenceGroups[i].tiles[0].rank == Rank.One && this.sequenceGroups[j].tiles[0].rank == Rank.Four && this.sequenceGroups[k].tiles[0].rank == Rank.Seven) ||
						(this.sequenceGroups[i].tiles[0].rank == Rank.Four && this.sequenceGroups[j].tiles[0].rank == Rank.Seven && this.sequenceGroups[k].tiles[0].rank == Rank.One) ||
						(this.sequenceGroups[i].tiles[0].rank == Rank.Seven && this.sequenceGroups[j].tiles[0].rank == Rank.One && this.sequenceGroups[k].tiles[0].rank == Rank.Four)
					)) return this._hasPureStraightWin = true;
				}
			}
		}

		return this._hasPureStraightWin = false;
	}
	private clearHasPureStraightWin() { this._hasPureStraightWin = undefined; }

	private _hasAllSimplesWin?: boolean;
	public get hasAllSimplesWin(): boolean
	{
		if (this._hasAllSimplesWin !== undefined) return this._hasAllSimplesWin;

		this.setSuitBasedWins();
		return this._hasAllSimplesWin ?? false;
	}

	private _hasAllTerminalsWin?: boolean;
	public get hasAllTerminalsWin(): boolean
	{
		if (this._hasAllTerminalsWin !== undefined) return this._hasAllTerminalsWin;

		this.setSuitBasedWins();
		return this._hasAllTerminalsWin ?? false;
	}

	private _hasAllHonorsWin?: boolean;
	public get hasAllHonorsWin(): boolean
	{
		if (this._hasAllHonorsWin !== undefined) return this._hasAllHonorsWin;

		this.setSuitBasedWins();
		return this._hasAllHonorsWin ?? false;
	}

	private _hasHalfOutsideWin?: boolean;
	public get hasHalfOutsideWin(): boolean
	{
		if (this._hasHalfOutsideWin !== undefined) return this._hasHalfOutsideWin;

		this.setSuitBasedWins();
		return this._hasHalfOutsideWin ?? false;
	}

	private _hasFullOutsideWin?: boolean;
	public get hasFullOutsideWin(): boolean
	{
		if (this._hasFullOutsideWin !== undefined) return this._hasFullOutsideWin;

		this.setSuitBasedWins();
		return this._hasFullOutsideWin ?? false;
	}

	private setSuitBasedWins()
	{
		if (this.allHandGroups.length != 5)
		{
			this._hasAllSimplesWin = false;
			this._hasAllTerminalsWin = false;
			this._hasAllHonorsWin = false;
			this._hasHalfOutsideWin = false;
			this._hasFullOutsideWin = false;
		}
		else if (this.allHandTiles.every(tile => Rank.isSimple(tile.rank)))
		{
			this._hasAllSimplesWin = true;
			this._hasAllTerminalsWin = false;
			this._hasAllHonorsWin = false;
			this._hasHalfOutsideWin = false;
			this._hasFullOutsideWin = false;
		}
		else if (this.allHandTiles.every(tile => Rank.isTerminal(tile.rank)))
		{
			this._hasAllSimplesWin = false;
			this._hasAllTerminalsWin = true;
			this._hasAllHonorsWin = false;
			this._hasHalfOutsideWin = false;
			this._hasFullOutsideWin = false;
		}
		else if (this.allHandTiles.every(tile => Rank.isHonor(tile.rank)))
		{
			this._hasAllSimplesWin = false;
			this._hasAllTerminalsWin = false;
			this._hasAllHonorsWin = true;
			this._hasHalfOutsideWin = false;
			this._hasFullOutsideWin = false;
		}
		else if (this.allHandTiles.every(tile => Rank.isHonor(tile.rank) || Rank.isTerminal(tile.rank)))
		{
			this._hasAllSimplesWin = false;
			this._hasAllTerminalsWin = false;
			this._hasAllHonorsWin = false;
			this._hasHalfOutsideWin = false;
			this._hasFullOutsideWin = true;
		}
		else if (this.allHandGroups.every(g => g.tiles.findIndex(t => Rank.isTerminal(t.rank) || Rank.isHonor(t.rank)) != -1))
		{
			this._hasAllSimplesWin = false;
			this._hasAllTerminalsWin = false;
			this._hasAllHonorsWin = false;
			this._hasHalfOutsideWin = true;
			this._hasFullOutsideWin = false;
		}
	}
	private clearSuitBasedWins()
	{
		this._hasAllSimplesWin = undefined;
		this._hasAllTerminalsWin = undefined;
		this._hasAllHonorsWin = undefined;
		this._hasHalfOutsideWin = undefined;
		this._hasFullOutsideWin = undefined;
		this._hasAllGreensWin = undefined;
	}
	
	private _hasAllGreensWin?: boolean;
	public get hasAllGreensWin(): boolean
	{
		return this._hasAllGreensWin ?? (this._hasAllGreensWin =
			this.allHandTiles.every(tile => tile.isGreen)
		);
	}

	private _hasAllTripletsWin?: boolean;
	public get hasAllTripletsWin(): boolean
	{
		return this._hasAllTripletsWin ?? (this._hasAllTripletsWin =
			this.openHand &&
			this.tripletGroups.length + this.kanGroups.length == 4
		);
	}
	private clearHasAllTripletsWin() { this._hasAllTripletsWin = undefined; }

	private _hasThreeConcealedTripletsWin?: boolean;
	public get hasThreeConcealedTripletsWin(): boolean
	{
		return this._hasThreeConcealedTripletsWin ?? (this._hasThreeConcealedTripletsWin =
			this.kanGroups.length + this.tripletGroups.length >= 3 &&
			this.closedGroups.length >= 3 &&
			this.concealedTuplets.length == 3
		);
	}
	private clearHasThreeConcealedTripletsWin() { this._hasThreeConcealedTripletsWin = undefined; }
	
	private _hasFourConcealedTripletsWin?: boolean;
	public get hasFourConcealedTripletsWin(): boolean
	{
		return this._hasFourConcealedTripletsWin ?? (this._hasFourConcealedTripletsWin =
			this.closedHand &&
			this.kanGroups.length + this.tripletGroups.length == 4 &&
			this.concealedTuplets.length == 4 &&
			this.winningTileGroup !== null &&
			this.winningTileGroup.tiles.length > 2
		);
	}
	private clearHasFourConcealedTripletsWin() { this._hasFourConcealedTripletsWin = undefined; }

	private _hasSingleWaitFourConcealedTripletsWin?: boolean;
	public get hasSingleWaitFourConcealedTripletsWin(): boolean
	{
		return this._hasSingleWaitFourConcealedTripletsWin ?? (this._hasSingleWaitFourConcealedTripletsWin =
			this.closedHand &&
			this.kanGroups.length + this.tripletGroups.length == 4 &&
			this.concealedTuplets.length == 4 &&
			this.winningTileGroup?.tiles.length == 2
		);
	}
	private clearHasSingleWaitFourConcealedTripletsWin() { this._hasSingleWaitFourConcealedTripletsWin = undefined; }

	private _hasThreeKansWin?: boolean;
	public get hasThreeKansWin(): boolean
	{
		return this._hasThreeKansWin ?? (this._hasThreeKansWin =
			this.kanGroups.length == 3
		);
	}
	private clearHasThreeKansWin() { this._hasThreeKansWin = undefined; }

	private _hasFourKansWin?: boolean;
	public get hasFourKansWin(): boolean
	{
		return this._hasFourKansWin ?? (this._hasFourKansWin =
			this.kanGroups.length == 4
		);
	}
	private clearHasFourKansWin() { this._hasFourKansWin = undefined; }

	private _hasSequenceTripletsWin?: boolean;
	public get hasSequenceTripletsWin(): boolean
	{
		if (this._hasSequenceTripletsWin !== undefined) return this._hasSequenceTripletsWin;

		for (let i = 0; i < this.tupletGroups.length - 2; i++)
		{
			for (let j = i + 1; j < this.tupletGroups.length - 1; j++)
			{
				for (let k = j + 1; k < this.tupletGroups.length; k++)
				{
					if (this.tupletGroups[i].tiles[0].rank == this.tupletGroups[j].tiles[0].rank &&
						this.tupletGroups[j].tiles[0].rank == this.tupletGroups[k].tiles[0].rank)
					{
						return this._hasSequenceTripletsWin = true;
					}
				}
			}
		}

		return this._hasSequenceTripletsWin = false;
	}
	private clearHasSequenceTripletsWin() { this._hasSequenceTripletsWin = undefined; }

	private _suitsInHand?: Suit[];
	public get suitsInHand(): Suit[]
	{
		return this._suitsInHand ?? (this._suitsInHand =
			this.allHandTiles.map(tile => tile.suit).filter((suit, index, suits) => suits.indexOf(suit) == index)
		);
	}
	private clearSuitsInHand()
	{
		this._suitsInHand = undefined;
		this.clearHasHalfFlushWin();
		this.clearHasFullFlushWin();
		this.clearHasNineGatesWin();
		this.clearHasTrueNineGatesWin();
	}

	private _hasHalfFlushWin?: boolean;
	public get hasHalfFlushWin(): boolean
	{
		return this._hasHalfFlushWin ?? (this._hasHalfFlushWin =
			this.suitsInHand.length == 2 &&
			this.suitsInHand.find(suit => suit == Suit.Honor) !== undefined
		);
	}
	private clearHasHalfFlushWin() { this._hasHalfFlushWin = undefined; }

	private _hasFullFlushWin?: boolean;
	public get hasFullFlushWin(): boolean
	{
		return this._hasFullFlushWin ?? (this._hasFullFlushWin =
			this.suitsInHand.length == 1 &&
			this.suitsInHand[0] != Suit.Honor &&
			this.hasNineGatesWin == false
		);
	}
	private clearHasFullFlushWin() { this._hasFullFlushWin = undefined; }

	private _hasNineGatesWin?: boolean;
	public get hasNineGatesWin(): boolean
	{
		if (this._hasNineGatesWin !== undefined) return this._hasNineGatesWin;

		this.setNineGatesWins();
		return this._hasNineGatesWin ?? false;
	}
	private clearHasNineGatesWin() { this._hasNineGatesWin = undefined; }

	private _hasTrueNineGatesWin?: boolean;
	public get hasTrueNineGatesWin(): boolean
	{
		if (this._hasTrueNineGatesWin !== undefined) return this._hasTrueNineGatesWin;

		this.setNineGatesWins();
		return this._hasTrueNineGatesWin ?? false;
	}
	private clearHasTrueNineGatesWin() { this._hasTrueNineGatesWin = undefined; }

	private setNineGatesWins(): void
	{
		if (this.openHand || this.suitsInHand.length != 1 || this.suitsInHand[0] == Suit.Honor)
			this._hasNineGatesWin = this._hasTrueNineGatesWin = false;
		
		const nineGatesTrueHand = [Rank.One, Rank.One, Rank.One, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Nine, Rank.Nine];
		this.hiddenHandTiles.forEach(t =>
		{
			let index = nineGatesTrueHand.indexOf(t.rank);
			if (index != -1)
				nineGatesTrueHand.splice(index, 1);
		});

		if (nineGatesTrueHand.length == 0)
		{
			this._hasTrueNineGatesWin = true;
			this._hasNineGatesWin = false;
		}
		else if (nineGatesTrueHand.length == 1 && this.winningTile?.rank == nineGatesTrueHand[0])
		{
			this._hasTrueNineGatesWin = false;
			this._hasNineGatesWin = true;
		}
		else
		{
			this._hasTrueNineGatesWin = this._hasNineGatesWin = false;
		}
	}

	public constructor() { }

	private handChanged(): void
	{
		this._wins = undefined;
		this._handError = undefined;
	}

	private _wins?: readonly Win[];
	public get wins(): readonly Win[]
	{
		if (this._wins !== undefined) return this._wins;

		const _wins_: Win[] = [];

		if (this.hasDoubleRiichiWin) _wins_.push(WinCatalog.Double_Riichi);
		if (this.hasRiichiWin) _wins_.push(WinCatalog.Riichi);
		if (this.hasIppatsuWin) _wins_.push(WinCatalog.Ippatsu);
		if (this.hasMenzenchinTsumoWin) _wins_.push(WinCatalog.Menzenchin_Tsumo);
		if (this.hasUnderTheSeaWin) _wins_.push(WinCatalog.Under_The_Sea);
		if (this.hasUnderTheRiverWin) _wins_.push(WinCatalog.Under_The_River);
		if (this.hasRinshanKaihouWin) _wins_.push(WinCatalog.Rinshan_Kaihou);
		if (this.hasRobbingAKanWin) _wins_.push(WinCatalog.Robbing_A_Kan);
		if (this.hasSevenPairsWin) _wins_.push(WinCatalog.Seven_Pairs);
		if (this.hasThirteenOrphansWin) _wins_.push(WinCatalog.Thirteen_Orphans);
		if (this.hasPureThirteenOrphansWin) _wins_.push(WinCatalog.Pure_Thirteen_Orphans);
		if (this.hasPinfuWin) _wins_.push(WinCatalog.Pinfu);
		if (this.hasPureDoubleSequenceWin) _wins_.push(WinCatalog.Pure_Double_Sequence);
		if (this.hasTwicePureDoubleSequenceWin) _wins_.push(WinCatalog.Twice_Pure_Double_Sequence);
		if (this.hasGreenDragonYakuhaiWin) _wins_.push(WinCatalog.Green_Dragon_Yakuhai);
		if (this.hasWhiteDragonYakuhaiWin) _wins_.push(WinCatalog.White_Dragon_Yakuhai);
		if (this.hasRedDragonYakuhaiWin) _wins_.push(WinCatalog.Red_Dragon_Yakuhai);
		if (this.hasPrevalentWindWin) _wins_.push(WinCatalog.Prevalent_Wind);
		if (this.hasSeatWindWin) _wins_.push(WinCatalog.Seat_Wind);
		if (this.hasLittleThreeDragonsWin) _wins_.push(WinCatalog.Little_Three_Dragons);
		if (this.hasBigThreeDragonsWin) _wins_.push(WinCatalog.Big_Three_Dragons);
		if (this.hasLittleFourWindsWin) _wins_.push(WinCatalog.Little_Four_Winds);
		if (this.hasBigFourWindsWin) _wins_.push(WinCatalog.Big_Four_Winds);
		if (this.hasMixedTripleSequenceWin) _wins_.push(WinCatalog.Mixed_Triple_Sequence);
		if (this.hasPureStraightWin) _wins_.push(WinCatalog.Pure_Straight);
		if (this.hasAllTerminalsWin) _wins_.push(WinCatalog.All_Terminals);
		if (this.hasAllHonorsWin) _wins_.push(WinCatalog.All_Honors);
		if (this.hasAllGreensWin) _wins_.push(WinCatalog.All_Green);
		if (this.hasAllSimplesWin) _wins_.push(WinCatalog.All_Simples);
		if (this.hasFullOutsideWin) _wins_.push(WinCatalog.Full_Outside_Hand);
		if (this.hasHalfOutsideWin) _wins_.push(WinCatalog.Half_Outside_Hand);
		if (this.hasAllTripletsWin) _wins_.push(WinCatalog.All_Triplets);
		if (this.hasThreeConcealedTripletsWin) _wins_.push(WinCatalog.Three_Concealed_Triplets);
		if (this.hasFourConcealedTripletsWin) _wins_.push(WinCatalog.Four_Concealed_Triplets);
		if (this.hasSingleWaitFourConcealedTripletsWin) _wins_.push(WinCatalog.Single_Wait_Four_Concealed_Triplets);
		if (this.hasThreeKansWin) _wins_.push(WinCatalog.Three_Kans);
		if (this.hasFourKansWin) _wins_.push(WinCatalog.Four_Kans);
		if (this.hasSequenceTripletsWin) _wins_.push(WinCatalog.Triple_Triplets);
		if (this.hasTrueNineGatesWin) _wins_.push(WinCatalog.True_Nine_Gates);
		if (this.hasNineGatesWin) _wins_.push(WinCatalog.Nine_Gates);
		if (this.hasFullFlushWin) _wins_.push(WinCatalog.Full_Flush);
		if (this.hasHalfFlushWin) _wins_.push(WinCatalog.Half_Flush);

		if (_wins_.length == 0) return this._wins = [];

		for (let i = 0; i < this.redFives.length; i++)
			_wins_.push(WinCatalog.Red_Five);

		for (let dora of this.doraIndicators)
		{
			const next = Rank.getCyclicNext(dora.rank);
			for (let t of this.allHandTiles)
			{
				if (t.rank == next && t.suit == dora.suit)
					_wins_.push(WinCatalog.Dora_Indicator);
			}
		}

		return this._wins = _wins_;
	}

	private _baseWinAmount?: number;
	public get baseWinAmount(): number
	{
		if (this._baseWinAmount !== undefined) return this._baseWinAmount;

		this.SetWinAmount();
		return this._baseWinAmount!;
	}

	private _winTitle?: string;
	public get winTitle(): string
	{
		if (this._winTitle !== undefined) return this._winTitle;

		this.SetWinAmount();
		return this._winTitle!;
	}

	private _payOrder?: string;
	public get payOrder(): string
	{
		if (this._payOrder !== undefined) return this._payOrder;

		this.SetWinAmount();
		return this._payOrder!;
	}

	private SetWinAmount(): void
	{
		if (this.wins.findIndex(w => w.yaakuman == Yaakuman.Double) != -1)
		{
			this._baseWinAmount = 16_000;
			this._winTitle = "Double Yaakuman";
		}
		else if (this.wins.findIndex(w => w.yaakuman == Yaakuman.Single) != -1)
		{
			this._baseWinAmount = 8_000;
			this._winTitle = "Yaakuman";
		}
		else
		{
			const han = this.closedHand ?
				this.wins.reduce((sum, w) =>
				{
					if (w.closed_han) return sum + w.closed_han;
					else throw new Error("There is a closed hand win without closed_han");
				}, 0) :
				this.wins.reduce((sum, w) =>
				{
					if (w.open_han) return sum + w.open_han;
					else throw new Error("There is an open hand win without open_han");
				}, 0);
			
			if (han >= 5) switch (han)
			{
				case 5: this._baseWinAmount = 2_000; this._winTitle = "Mangan"; break;
				case 6:
				case 7: this._baseWinAmount = 3_000; this._winTitle = "Haneman"; break;
				case 8:
				case 9:
				case 10: this._baseWinAmount = 4_000; this._winTitle = "Baiman"; break;
				case 11:
				case 12: this._baseWinAmount = 6_000; this._winTitle = "Sanbaiman"; break;
				default: this._baseWinAmount = 8_000; this._winTitle = "Kazoe Yaakuman"; break;
			}
			// Calculate fu
			else
			{
				if (this.hasSevenPairsWin)
				{
					this._baseWinAmount = 25;
					this._winTitle = "7Pairs (25)";
				}
				else
				{
					this._baseWinAmount = 20;
					const titles: string[] = [];
					if (this.closedGroups && !this.tsumo)
					{
						this._baseWinAmount += 10;
						titles.push("Menzen-Kafu (10)");
					}

					// tsumo can only be given on pinfu open (no pinfu for open tho )
					if (this.tsumo && this.isPinfuHand)
					{
						this._baseWinAmount += 2;
						titles.push("Tsumo (2)");
					}
					else
					{
						for (const g of this.allHandGroups)
						{
							let points = 0;
							let title = "";
							if (g.type == TileGroupType.Triplet)
							{
								points = 2;
								title = "Triplet";
							}
							else if (g.type == TileGroupType.Kan)
							{
								points = 8;
								title = "Kan";
							}
							else continue;

							if (Rank.isTerminal(g.tiles[0].rank))
							{
								points *= 2;
								title = "Terminal " + title;
							}
							else if (Rank.isHonor(g.tiles[0].rank))
							{
								points *= 2;
								title = "Honor " + title;
							}

							if (g.closed)
							{
								points *= 2;
								title = "Closed " + title;
							}

							this._baseWinAmount += points;
							titles.push(title + " (" + points + ")");
						}
					
						let singleWait =
							this.pairGroup !== null &&
							this.pairGroup == this.winningTileGroup &&
							this.winningTileGroup.type == TileGroupType.Sequence &&
							this.winningTileGroup.tiles[0] == this.winningTile;

						if (singleWait)
						{
							this._baseWinAmount += 2;
							titles.push("Single Wait (2)");
						}

						if (this.pairGroup !== null && (
							Rank.isDragon(this.pairGroup.tiles[0].rank) ||
							this.pairGroup.tiles[0].rank == this.seatWind ||
							this.pairGroup.tiles[0].rank == this.prevalentWind
						)) {
							this._baseWinAmount += 2;
							titles.push("Yakuhai Pair (2)");
						}

						if (this._baseWinAmount == 20 && this.openHand)
						{
							this._baseWinAmount += 2;
							titles.push("Open Pinfu (2)");
						}

						this._baseWinAmount = Math.ceil(this._baseWinAmount / 10) * 10;
						this._winTitle = titles.join(", ");
					}
				}

				this._baseWinAmount = this._baseWinAmount * Math.pow(2, 2 + han);

				if (this._baseWinAmount > 2_000)
				{
					this._baseWinAmount = 2_000;
					this._winTitle = "Mangan!: " + this._winTitle;
				}
			}
		}

		console.log("Winning: " + this._winTitle + " (" + this._baseWinAmount + ")", "info");

		if (this.tsumo)
		{
			if (this.seatWind == this.prevalentWind)
			{
				this._payOrder = `Each player pays ${round100(this._baseWinAmount * 2)} for ${round100(this._baseWinAmount * 2 * 3)} in total.`;
			}
			else
			{
				this._payOrder = `The dealer (${Rank[this.prevalentWind]}) pays ${round100(this._baseWinAmount * 2)} and other players pay ${round100(this._baseWinAmount)} for ${round100(this._baseWinAmount * 2 * 2)} in total.`;
			}
		}
		else if (this.seatWind == this.prevalentWind)
		{
			this._payOrder = `Losing player pays ${round100(this._baseWinAmount * 6)}.`;
		} else
		{
			this._payOrder = `Losing player pays ${round100(this._baseWinAmount * 4)}.`;
		}
	}

	private _handError?: string | null = null;
	public get handError(): string | null
	{
		if (this._handError !== undefined) return this._handError;

		try
		{
			this.ValidateHandSize();
			this.ValidateScoreParameters();
			this.ValidateFlippedTiles();
			this.ValidateBoard();
			this.ValidateGroups();

			if (this.wins.length == 0)
				throw new Error("No wins! Hand is valid, but cannot be a winning hand");

			if (this.pureDoubleSequenceCount > 2)
				throw new InvalidScoreArgumentsError("There are more than two pure double sequences in the hand! This means that there were three triplets that were grouped as runs and not triplets!");

			return this._handError = null;
		}
		catch (e: any)
		{
			return this._handError = e.message;
		}
	}

	/**
	 * Helper function to evaluate the scores and winning of the hand, catching any errors.
	 */
	public ValidateHand(): string | null
	{
		return this.handError;
	}

	public isValid(): boolean { return this.handError === null; }
}


namespace HandGrouper
{
	function GetSevenPairs(tiles: Tile[]): TileGroup[] | null
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

		return pairs.map(p => new TileGroup([tiles[p[0]], tiles[p[1]]], true));
	}

	function GetThirteenOrphans(tiles: Tile[]): TileGroup[] | null
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
			return orphans.map(g => new TileGroup(g, true, true));
		}
		else return null;
	}

	export function CreateClosedGroups(closed_tiles: Tile[]): readonly TileGroup[]
	{
		let specialGroup: TileGroup[] | null;

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


		const closed_groups: TileGroup[] = [];

		let throwError = (str: string): TileGroup[] =>
		{
			let error = (str + ": Found => " + TileGroup.stringifyArray(closed_groups) + ", invalid => " + Tile.stringifyArray(closed_tiles));
			return closed_groups.concat(new TileGroup(closed_tiles, true, false, error));
		}; 

		let created_pair: boolean = false;
		let sorted = false;
		let loop_count = 0;
		while (closed_tiles.length > 0)
		{
			loop_count++;
			if (loop_count > 10) return throwError("Loop count broke!");
			switch (closed_tiles.length)
			{
				case 1:
					return throwError("Cannot have a single tile left over when creating closed groups");
					break;

				case 2:
					if (Tile.isPair(closed_tiles))
						closed_groups.push(new TileGroup(closed_tiles.splice(0, 2), true));
					else return throwError("Cannot have a single tile left over when creating closed groups");
					break;

				case 3:
					if (Tile.isMeld(closed_tiles))
						closed_groups.push(new TileGroup(closed_tiles.splice(0, 3), true));
					else return throwError("Bad meld while creating closed groups");
					break;

				case 4:
				case 7:
				case 10:
				case 13:
					return throwError(`Cannot (ever) create groups from ${closed_tiles.length} tiles when creating closed groups (needs to be multiple of 3 with pair)`);
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
						return throwError(`Could not find ANY melds while creating closed groups from the last ${closed_tiles.length} tiles (which must have at least one meld)`);
					else
					{
						closed_groups.push(new TileGroup(
							[closed_tiles[foundMeld[0]], closed_tiles[foundMeld[1]], closed_tiles[foundMeld[2]]]
						, true));
						closed_tiles.splice(foundMeld[2], 1);
						closed_tiles.splice(foundMeld[1], 1);
						closed_tiles.splice(foundMeld[0], 1);
					}
					break;

				case 8:
				case 11:
				case 14:
					if (created_pair)
						return throwError(`Cannot create groups from ${closed_tiles.length} tiles because pair was already made when creating closed groups`);
					
					// First, find any triplets that cannot be a sequence
					const triplet = FindNonSequenceTriplet(closed_tiles);
					if (triplet != null)
					{
						closed_groups.push(new TileGroup(
							[closed_tiles[triplet[0]], closed_tiles[triplet[1]], closed_tiles[triplet[2]]]
						, true));
						closed_tiles.splice(triplet[2], 1);
						closed_tiles.splice(triplet[1], 1);
						closed_tiles.splice(triplet[0], 1);
						break;
					}

					// Find a pair that keeps the hand valid (only one pair if there is a pair with no meld options)
					const pairs: [number, number][] = FindBestValidPairs(closed_tiles);

					if (pairs.length <= 0)
						return throwError(`Could not find a pair while creating closed groups from the last ${closed_tiles.length} tiles (which must have a pair)`);
					else if (pairs.length == 1)
					{
						closed_groups.push(new TileGroup(
							[closed_tiles[pairs[0][0]], closed_tiles[pairs[0][1]]]
							, true));
						closed_tiles.splice(pairs[0][1], 1);
						closed_tiles.splice(pairs[0][0], 1);
						created_pair = true;
					}
					else
					{
						for (let i = 0; i < pairs.length; i++)
						{
							try
							{
								let copy = [...closed_tiles];
								copy.splice(pairs[i][1], 1);
								copy.splice(pairs[i][0], 1);
								let groups = CreateClosedGroups(copy);
								closed_groups.push(new TileGroup(
									[closed_tiles[pairs[i][0]], closed_tiles[pairs[i][1]]]
									, true));
								return closed_groups.concat(groups);
							}
							catch (e) { }
						}

						return throwError(`Could find pairs, but all resulted in bad hands while creating closed groups from the last ${closed_tiles.length} tiles (which must have a pair). Pairs: ` + pairs.map(p => `[${closed_tiles[p[0]].rank}, ${closed_tiles[p[1]].rank}]`).join(", "));
					}

					break;

				default:
					return throwError("Closed tiles is higher than 14!");
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