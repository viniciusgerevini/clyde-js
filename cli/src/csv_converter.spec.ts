import { parse } from '@clyde-lang/parser';
import { csvConverter } from './csv_converter';

describe('CSV Converter', () => {
  it('convert lines', () => {
    const doc = parse(`
line one $first_id
line two
line three $third_id
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text\nfirst_id;line one\n;line two\nthird_id;line three`);
  });

  it('convert lines', () => {
    const doc = parse(`
line one $first_id
line two
line three $third_id
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text\nfirst_id;line one\n;line two\nthird_id;line three`);
  });

  it('convert options', () => {
    const doc = parse(`
* option 1 $id1
  text 1 $id2
+ option 2 $id3
  text 2 $id4
>= option 3 $id5

another list $id6
  * option 4 $id7
  * option 5 $id8
  * option 6
    text 3
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text
id1;option 1
id2;text 1
id3;option 2
id4;text 2
id5;option 3
id6;another list
id7;option 4
id8;option 5
;option 6
;text 3`
    );
  });

  it('convert variations', () => {
    const doc = parse(`
(
  - var 1 $id1
  - var 2
  -
    var 3
    var 4
)
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text
id1;var 1
;var 2
;var 3
;var 4`
    );
  });

  it('convert blocks', () => {
    const doc = parse(`
line one $first_id
== this is a block
line two
line three $third_id
== this is another block
hello
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text\nfirst_id;line one\n;line two\nthird_id;line three\n;hello`);
  });

  it('add quotes to content column when it contains separator character', () => {
    const doc = parse(`
line; one $first_id
line; two
line; "three" 3 $third_id
`);
    const result = csvConverter(doc);
    expect(result).toEqual(`id;text\nfirst_id;"line; one"\n;"line; two"\nthird_id;"line; \\"three\\" 3"`);
  });

  it('use custom separator', () => {
    const doc = parse(`
line one $first_id
line two
line three $third_id
`);
    const result = csvConverter(doc, { separator: ',' });
    expect(result).toEqual(`id,text\nfirst_id,line one\n,line two\nthird_id,line three`);
  });

  it('add custom header', () => {
    const doc = parse(`
line one $first_id
line two $second_id
`);
    const result = csvConverter(doc, { header: 'key;content' });
    expect(result).toEqual(`key;content\nfirst_id;line one\nsecond_id;line two`);
  });

  it('convert text under logic blocks', () => {
    const doc = parse(`
{ banana } hello $id1
{ set banana } what $id2
* { something } where $id3
  (
    - in variations $id4 { something}
  )
`);

    const result = csvConverter(doc);
    expect(result).toEqual(`id;text
id1;hello
id2;what
id3;where
id4;in variations`
    );
  });

  it('include metadata option', () => {
    const doc = parse(`
* option 1 $id1 #tag1
  text 1 $id2
+ npc: option 2 $id3 #tag3
  npc2: text 2 $id4 #tag2 #tag21
>= option 3 $id5

another list $id6
  * option 4 $id7
  * option 5 $id8
  * option 6
    text 3 #tag4
`);
    const result = csvConverter(doc, { withMetadata: true });
    expect(result).toEqual(`id;text;metadata
id1;option 1;tags: #tag1
id2;text 1;
id3;option 2;speaker: npc tags: #tag3
id4;text 2;speaker: npc2 tags: #tag2 #tag21
id5;option 3;
id6;another list;
id7;option 4;
id8;option 5;
;option 6;
;text 3;tags: #tag4`
    );
  });
});
