export enum Suit
{
	Bamboo = 0,
	Dot = 1,
	Character = 2,
	Honor = 3,
	Back = 4,
	NaN = 5,
}

export enum Rank
{
	NaN = 0,
	One = 1,
	Two = 2,
	Three = 3,
	Four = 4,
	Five = 5,
	Six = 6,
	Seven = 7,
	Eight = 8,
	Nine = 9,

	GreenDragon = 10,
	RedDragon = 11,
	WhiteDragon = 12,

	EastWind = 13,
	SouthWind = 14,
	WestWind = 15,
	NorthWind = 16,

	Back = 17,
}

export namespace Rank
{
	export function isValid(rank: Rank): boolean
	{
		return rank == Rank.NaN;
	}

	export function isHonor(rank: Rank): boolean
	{
		return rank >= Rank.GreenDragon && rank <= Rank.NorthWind;
	}

	export function isWind(rank: Rank): boolean
	{
		return rank >= Rank.EastWind && rank <= Rank.NorthWind;
	}

	export function isDragon(rank: Rank): boolean
	{
		return rank >= Rank.GreenDragon && rank <= Rank.WhiteDragon;
	}

	export function isNumber(rank: Rank): boolean
	{
		return rank >= Rank.One && rank <= Rank.Nine;
	}

	export function isTerminal(rank: Rank): boolean
	{
		return rank == Rank.One || rank == Rank.Nine;
	}

	export function isSimple(rank: Rank): boolean
	{
		return rank >= Rank.Two && rank <= Rank.Eight;
	}

	export function getCyclicNext(rank: Rank): Rank
	{
		if (rank >= Rank.One || rank <= Rank.Nine)
		{
			if (rank == Rank.Nine)
				return Rank.One;
			else
				return rank + 1;
		}
		else if (rank >= Rank.EastWind || rank <= Rank.NorthWind)
		{
			if (rank == Rank.NorthWind)
				return Rank.EastWind;
			else
				return rank + 1;
		}
		else if (rank >= Rank.GreenDragon || rank <= Rank.WhiteDragon)
		{
			if (rank == Rank.WhiteDragon)
				return Rank.GreenDragon;
			else
				return rank + 1;
		}
		else
		{
			return Rank.NaN;
		}
	}
}

export class InvalidTileError extends Error
{
	constructor(message: string)
	{
		super(message);
	}
}

export class InvalidHandAndTilesError extends Error
{
	constructor(message: string)
	{
		super(message);
	}
}

export class InvalidScoreArgumentsError extends Error
{
	constructor(message: string)
	{
		super(message);
	}
}

export interface TileBuilder
{
	suit?: Suit;
	rank?: Rank;
	isRed?: boolean;
}

export class Tile
{
	private _suit: Suit;
	private _rank: Rank;
	private _isFaceDown: boolean;

	public get suit(): Suit { return this._suit; }
	public get rank(): Rank { return this._rank; }
	public get isFaceDown(): boolean { return this._isFaceDown; }

	/** Iff the tile is a 5, isRed is if the tile is a red 5 */
	public readonly isRed: boolean;
	/** If the tile was called from another player (thus part of an open set) */
	public readonly isCalled: boolean;

	constructor(suit: Suit, rank: Rank, red: boolean = false, called: boolean = false)
	{
		this._suit = suit;
		this._rank = rank;
		this.isRed = red;
		this.isCalled = called;

		if (this.suit == Suit.NaN || this.rank == Rank.NaN)
			throw new InvalidTileError("Invalid tile: Suit or rank is NaN: " + this.stringify());
		
		if (this.suit == Suit.Back || this.rank == Rank.Back)
			if (this.suit != Suit.Back || this.rank != Rank.Back)
				throw new InvalidTileError("Invalid tile: Suit or rank is Back, but not both: " + this.stringify());
			else
				this._isFaceDown = true;
		else this._isFaceDown = false;
		
		if (this.suit == Suit.Honor && this.rank < Rank.GreenDragon)
			throw new InvalidTileError("Invalid tile: Honor suit but rank is not a dragon or wind: " + this.stringify());
		
		if (this.suit != Suit.Honor && this.rank >= Rank.GreenDragon && this.rank != Rank.Back)
			throw new InvalidTileError("Invalid tile: Non-honor suit but rank is a dragon or wind: " + this.stringify());

		if (this.rank != Rank.Five && this.isRed)
			throw new InvalidTileError("Invalid tile: Rank is not 5 but isRed is true: " + this.stringify());
	}

	public overrideData(suit: Suit, rank: Rank, isRed: boolean): void
	{
		if (this.suit != Suit.Back || this.rank != Rank.Back || !this.isFaceDown)
			throw new InvalidTileError("Can only override data on a back tile: " + this.stringify());
		if (this.isCalled)
			throw new InvalidTileError("Cannot override data of a called tile: " + this.stringify());

		this._suit = suit;
		this._rank = rank;
	}

	private _isGreen?: boolean;
	public get isGreen(): boolean
	{
		return this._isGreen ?? (this._isGreen =
			(this.suit == Suit.Bamboo && (
				this.rank == Rank.Two ||
				this.rank == Rank.Three ||
				this.rank == Rank.Four ||
				this.rank == Rank.Six ||
				this.rank == Rank.Eight
			)) || (this.suit == Suit.Honor && this.rank == Rank.GreenDragon)
		);
	}

	public shortStringify(): string
	{
		return Tile.shortStringifyData(this.rank, this.suit, this.isRed);
	}

	public static shortStringifyData(rank: Rank, suit: Suit, isRed: boolean = false): string
	{
		if (Rank.isNumber(rank) && (suit != Suit.Bamboo && suit != Suit.Dot && suit != Suit.Character))
		{
			return "NaN";
		}

		if (Rank.isHonor(rank) && suit != Suit.Honor)
		{
			return "NaN";
		}

		if (rank == Rank.NaN || suit == Suit.NaN)
		{
			return "NaN";
		}

		let suitChar = "";
		switch (suit)
		{
			case Suit.Bamboo: suitChar = "b"; break;
			case Suit.Character: suitChar = "n"; break;
			case Suit.Dot: suitChar = "d"; break;
		}

		switch (rank)
		{
			case Rank.One: return "1" + suitChar;
			case Rank.Two: return "2" + suitChar;
			case Rank.Three: return "3" + suitChar;
			case Rank.Four: return "4" + suitChar;
			case Rank.Five: return ((isRed) ? "$" : "5") + suitChar;
			case Rank.Six: return "6" + suitChar;
			case Rank.Seven: return "7" + suitChar;
			case Rank.Eight: return "8" + suitChar;
			case Rank.Nine: return "9" + suitChar;
			case Rank.GreenDragon: return "gd";
			case Rank.RedDragon: return "rd";
			case Rank.WhiteDragon: return "wd";
			case Rank.EastWind: return "ew";
			case Rank.SouthWind: return "sw";
			case Rank.WestWind: return "ww";
			case Rank.NorthWind: return "nw";
			case Rank.Back: return "xx";
		}

		return "??";
	}

	public static fromBuilder(builder: TileBuilder): Tile
	{
		if (builder.suit == undefined)
			throw new InvalidTileError("Invalid tile: Suit is undefined. Make sure that all tiles have been set!");
		if (builder.rank == undefined)
			throw new InvalidTileError("Invalid tile: Rank is undefined. Make sure that all tiles have been set!");
		if (builder.isRed == undefined)
			builder.isRed = false;

		return new Tile(builder.suit, builder.rank, builder.isRed && builder.rank == Rank.Five);
	}

	public static parse(tileString: string, called: boolean = false): Tile
	{
		let suit: Suit;
		let rank: Rank;
		let isRed: boolean = false;

		switch (tileString[0])
		{
			case "1": rank = Rank.One; break;
			case "2": rank = Rank.Two; break;
			case "3": rank = Rank.Three; break;
			case "4": rank = Rank.Four; break;
			case "5": rank = Rank.Five; break;
			case "$": rank = Rank.Five; isRed = true; break;
			case "6": rank = Rank.Six; break;
			case "7": rank = Rank.Seven; break;
			case "8": rank = Rank.Eight; break;
			case "9": rank = Rank.Nine; break;
			case "g": rank = Rank.GreenDragon; break;
			case "r": rank = Rank.RedDragon; break;
			case "w": rank = Rank.WhiteDragon; break;
			case "e": rank = Rank.EastWind; break;
			case "s": rank = Rank.SouthWind; break;
			case "w": rank = Rank.WestWind; break;
			case "n": rank = Rank.NorthWind; break;
			case "x": rank = Rank.Back; break;
			default: throw new InvalidTileError("Invalid tile: Invalid rank: " + tileString);
		}

		switch (tileString[1])
		{
			case "b": suit = Suit.Bamboo; break;
			case "n": suit = Suit.Character; break;
			case "d": suit = Suit.Dot; break;
			case "g": suit = Suit.Honor; break;
			case "r": suit = Suit.Honor; break;
			case "w": suit = Suit.Honor; break;
			case "e": suit = Suit.Honor; break;
			case "s": suit = Suit.Honor; break;
			case "w": suit = Suit.Honor; break;
			case "n": suit = Suit.Honor; break;
			case "x": suit = Suit.Back; break;
			default: throw new InvalidTileError("Invalid tile: Invalid suit: " + tileString);
		}

		return new Tile(suit, rank, isRed, called);
	}

	public static isPair(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 2)
			return false;
		return tiles[0].softEquals(tiles[1]);
	}

	/**
	 * Predicate for whether a set of tiles is a triplet (three of the same tile)
	 * @param tiles The tiles to check
	 * @returns True if the tiles are a triplet, false otherwise
	 */
	public static isTriplet(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 3)
			return false;
		
		return tiles[0].softEquals(tiles[1]) && tiles[1].softEquals(tiles[2]);
	}

	/**
	 * Predicate for whether a set of tiles is a sequence (three tiles in a row)
	 * @param tiles The tiles to check
	 * @returns Whether the tiles are a sequence
	 */
	public static isSequence(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 3)
			return false;
		
		// If suits are the same
		if (tiles[0].suit != tiles[1].suit || tiles[1].suit != tiles[2].suit)
			return false;
		
		// If suits are numbers
		if (tiles[0].suit == Suit.Honor || tiles[0].suit == Suit.NaN || tiles[0].suit == Suit.Back)
			return false;
		
		// If ranks are in order (note that the order is not necessarily 1, 2, 3)
		return (
			// 0 => 1 => 2
			(tiles[0].rank + 1 == tiles[1].rank && tiles[1].rank + 1 == tiles[2].rank) ||
			// 0 => 2 => 1
			(tiles[0].rank + 1 == tiles[2].rank && tiles[2].rank + 1 == tiles[1].rank) ||
			// 1 => 0 => 2
			(tiles[1].rank + 1 == tiles[0].rank && tiles[0].rank + 1 == tiles[2].rank) ||
			// 1 => 2 => 0
			(tiles[1].rank + 1 == tiles[2].rank && tiles[2].rank + 1 == tiles[0].rank) ||
			// 2 => 0 => 1
			(tiles[2].rank + 1 == tiles[0].rank && tiles[0].rank + 1 == tiles[1].rank) ||
			// 2 => 1 => 0
			(tiles[2].rank + 1 == tiles[1].rank && tiles[1].rank + 1 == tiles[0].rank)
		);
	}

	public static orderedIsSequence(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 3)
			return false;
		
		// If suits are the same
		if (tiles[0].suit != tiles[1].suit || tiles[1].suit != tiles[2].suit)
			return false;
		
		// If suits are numbers
		if (tiles[0].suit == Suit.Honor || tiles[0].suit == Suit.NaN || tiles[0].suit == Suit.Back)
			return false;
		
		// If ranks are in order, and the order is 1, 2, 3
		return (
			// 0 => 1 => 2
			(tiles[0].rank + 1 == tiles[1].rank && tiles[1].rank + 1 == tiles[2].rank)
		);
	}

	public static isKan(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 4)
			return false;

		if (tiles[0].softEquals(tiles[1]) && tiles[1].softEquals(tiles[2]) && tiles[2].softEquals(tiles[3]))
			return true;

		return false;
	}

	public static isMeld(tiles: readonly Tile[]): boolean
	{
		if (tiles.length != 3 && tiles.length != 4)
		{
			return false;
		}

		if (tiles.length == 3)
		{
			return Tile.isTriplet(tiles) || Tile.isSequence(tiles);
		}
		else return Tile.isKan(tiles);
	}

	static hasQuintuplet(tiles: readonly Tile[])
	{
		if (tiles.length < 5)
			return false;
		
		for (let i = 0; i < tiles.length - 4; i++)
		{
			let matches = 3;

			for (let j = i + 1; j < tiles.length - matches; j++)
			{
				if (tiles[i].softEquals(tiles[j]))
				{
					if (matches == 0) return true;
					else matches--;
				}
			}
		}

		return false;
	}

	static DoubleRedFives(redFives: readonly Tile[]): boolean
	{
		if (length > 3) return true;
		
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
					return true;
			}
		}

		return false;
	}

	public softEquals(other: Tile): boolean
	{
		return this.suit == other.suit && this.rank == other.rank && this.rank != Rank.Back;
	}

	public stringify(): string
	{
		return this.suit + " of " + this.rank;
	}

	public static stringifyArray(tiles: readonly Tile[]): string
	{
		return "[" + tiles.map(t => t.shortStringify()).join(", ") + "]";
	}

	public static stringifyGroups(tiles: readonly Tile[][]): string
	{
		return "[" + tiles.map(t => Tile.stringifyArray(t)).join(", ") + "]";
	}
}

export enum TileGroupType
{
	Pair = 0,
	Triplet = 1,
	Sequence = 2,
	Kan = 3,
	Orphan = 4,
	Error = 5,
}

export class TileGroup
{
	private _tiles: Tile[];
	public get tiles(): readonly Tile[] { return this._tiles; }
	public closed: boolean;
	public type: TileGroupType;

	public readonly error?: string;

	constructor(tiles: Tile[], closed: boolean, canBeOrphan = false, customError?: string)
	{
		this._tiles = tiles;
		this.closed = closed;

		if (customError)
		{
			this.type = TileGroupType.Error;
			this.error = customError;
			return;
		}

		if (tiles.length != 2 && tiles.length != 3 && tiles.length != 4)
		{
			if (tiles.length == 1 && canBeOrphan)
			{
				this.type = TileGroupType.Orphan;
				return;
			}

			this.error = "Invalid number of tiles in a tile group: " + tiles.length + this.stringify();
			this.type = TileGroupType.Error;
			return;
		}

		if (Tile.isPair(tiles))
		{
			this.type = TileGroupType.Pair;
			if (!closed)
			{
				this.error = "Pairs must be closed: " + this.stringify();
				this.type = TileGroupType.Error;
				return;
			}
		}
		else if (Tile.isTriplet(tiles))
		{
			this.type = TileGroupType.Triplet;
		}
		else if (tiles.length == 3)
		{
			this._tiles.sort((a, b) => a.rank - b.rank);
			if (Tile.orderedIsSequence(tiles))
			{
				this.type = TileGroupType.Sequence;
			}
			else
			{
				this.error = "Invalid tiles for creating a group: " + this.stringify();
				this.type = TileGroupType.Error;
				return;
			}
		}
		else if (Tile.isKan(tiles))
		{
			this.type = TileGroupType.Kan;
			
			let backs = tiles.filter(t => t.isFaceDown)
			if (backs.length == 2)
			{
				this.closed = true;
			}
		}
		else if (tiles.length == 4)
		{
			// Kans are also possible if exactly two tiles are backs
			let nonBacks: Tile[] = tiles.filter(t => t.suit != Suit.Back && t.rank != Rank.Back);

			if (Tile.isPair(nonBacks))
			{
				let needsRedFive: boolean = nonBacks[0].rank === Rank.Five && nonBacks.find(t => t.isRed) == undefined;
				tiles.forEach(t =>
				{
					if (t.suit == Suit.Back && t.rank == Rank.Back)
					{
						if (needsRedFive)
						{
							t.overrideData(nonBacks[0].suit, nonBacks[0].rank, true);
							needsRedFive = false;
						}
						else t.overrideData(nonBacks[0].suit, nonBacks[0].rank, false);
					}
				});
				this.type = TileGroupType.Kan;
				this.closed = true;
			}
			else
			{
				this.error = "Invalid tiles for creating a group: " + this.stringify();
				this.type = TileGroupType.Error;
				return;
			}
		}
		else
		{
			this.error = "Invalid tiles for creating a group: " + this.stringify();
			this.type = TileGroupType.Error;
			return;
		}
	}

	public stringify() { return Tile.stringifyArray(this.tiles); }
	public static stringifyArray(groups: readonly TileGroup[])
	{
		return "[" + groups.map(g => Tile.stringifyArray(g.tiles)).join(", ") + "]";
	}
}

export enum Yaakuman { None = 0, Single = 1, Double = 2 }

export interface Win
{
	readonly name: string;
	readonly desc: string;
	readonly open_han: number | null;
	readonly closed_han: number | null;
	readonly yaakuman?: Yaakuman;
}