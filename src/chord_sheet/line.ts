import ChordLyricsPair from './chord_lyrics_pair';
import Tag from './tag';
import Comment from './comment';
import { CHORUS, NONE, VERSE } from '../constants';
import Item from './item';
import Font from './font';

type MapItemFunc = (_item: Item) => Item;

export type LineType = 'verse' | 'chorus' | 'none';

/**
 * Represents a line in a chord sheet, consisting of items of type ChordLyricsPair or Tag
 */
class Line {
  /**
   * The items ({@link ChordLyricsPair} or {@link Tag} or {@link Comment}) of which the line consists
   * @type {Array.<(ChordLyricsPair|Tag|Comment)>}
   */
  items: Item[] = [];

  /**
   * The line type, This is set by the ChordProParser when it read tags like {start_of_chorus} or {start_of_verse}
   * Values can be {@link VERSE}, {@link CHORUS} or {@link NONE}
   * @type {string}
   */
  type: LineType = NONE;

  currentChordLyricsPair: ChordLyricsPair = new ChordLyricsPair();

  key: string | null = null;

  transposeKey: string | null = null;

  /**
   * The text font that applies to this line. Is derived from the directives:
   * `textfont`, `textsize` and `textcolour`
   * See: https://www.chordpro.org/chordpro/directives-props_text_legacy/
   * @type {Font}
   */
  textFont: Font = new Font();

  /**
   * The chord font that applies to this line. Is derived from the directives:
   * `chordfont`, `chordsize` and `chordcolour`
   * See: https://www.chordpro.org/chordpro/directives-props_chord_legacy/
   * @type {Font}
   */
  chordFont: Font = new Font();

  constructor({ type, items }: { type: LineType, items: Item[]} = { type: NONE, items: [] }) {
    this.type = type;
    this.items = items;
  }

  /**
   * Indicates whether the line contains any items
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Adds an item ({@link ChordLyricsPair} or {@link Tag}) to the line
   * @param {ChordLyricsPair|Tag} item The item to be added
   */
  addItem(item: Item): void {
    if (item instanceof Tag) {
      this.addTag(item);
    } else if (item instanceof ChordLyricsPair) {
      this.addChordLyricsPair(item);
    } else if (item instanceof Comment) {
      this.addComment(item);
    } else {
      this.items.push(item);
    }
  }

  /**
   * Indicates whether the line contains items that are renderable
   * @returns {boolean}
   */
  hasRenderableItems(): boolean {
    return this.items.some((item) => item.isRenderable());
  }

  /**
   * Returns a deep copy of the line and all of its items
   * @returns {Line}
   */
  clone(): Line {
    return this.mapItems(null);
  }

  mapItems(func: MapItemFunc | null): Line {
    const clonedLine = new Line();

    clonedLine.items = this.items
      .map((item) => {
        const clonedItem = item.clone();
        return func ? func(clonedItem) : clonedItem;
      })
      .filter((item) => item);

    clonedLine.type = this.type;
    return clonedLine;
  }

  /**
   * Indicates whether the line type is {@link VERSE}
   * @returns {boolean}
   */
  isVerse(): boolean {
    return this.type === VERSE;
  }

  /**
   * Indicates whether the line type is {@link CHORUS}
   * @returns {boolean}
   */
  isChorus(): boolean {
    return this.type === CHORUS;
  }

  /**
   * Indicates whether the line contains items that are renderable. Please use {@link hasRenderableItems}
   * @deprecated
   * @returns {boolean}
   */
  hasContent(): boolean {
    return this.hasRenderableItems();
  }

  addChordLyricsPair(chords: ChordLyricsPair | string | null = null, lyrics = null): ChordLyricsPair {
    if (chords instanceof ChordLyricsPair) {
      this.currentChordLyricsPair = chords;
    } else {
      this.currentChordLyricsPair = new ChordLyricsPair(chords || '', lyrics || '');
    }

    this.items.push(this.currentChordLyricsPair);
    return this.currentChordLyricsPair;
  }

  ensureChordLyricsPair(): void {
    if (!this.currentChordLyricsPair) {
      this.addChordLyricsPair();
    }
  }

  chords(chr: string): void {
    this.ensureChordLyricsPair();
    this.currentChordLyricsPair.chords += chr;
  }

  lyrics(chr: string): void {
    this.ensureChordLyricsPair();
    this.currentChordLyricsPair.lyrics += chr;
  }

  addTag(nameOrTag: Tag | string, value: string | null = null): Tag {
    const tag = (nameOrTag instanceof Tag) ? nameOrTag : new Tag(nameOrTag, value);
    this.items.push(tag);
    return tag;
  }

  addComment(content: Comment | string): Comment {
    const comment = (content instanceof Comment) ? content : new Comment(content);
    this.items.push(comment);
    return comment;
  }

  set(properties: { type?: LineType, items?: Item[] }): Line {
    return new Line(
      {
        type: this.type,
        items: this.items,
        ...properties,
      },
    );
  }
}

export default Line;
