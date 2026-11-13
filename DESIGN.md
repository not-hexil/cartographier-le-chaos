# Cartographier Le Chaos

A personal literary archive-cum-blog website.

## Segments
### Le Chaos Apprivoise
Full length books
1. Aquamarine
2. Je Suis Le Chaos

### Al-Hawashi
 Shorter pieces and creative bursts
#### Sada - Poems
#### Khayal - Short Stories
#### Khatirat - Rants

### Ma`na & Maghza
Interpretations
#### L`Echo DIscordant - Music
#### Toilest Pensives - VIsual Art Analysis

### Hikayat Al-Gharib
Media review and cultural commentary

### Fikr and Fana
Analytical and Philosophical Essays

The Core idea of the website resolves around mapping internal turbulence through literature and inquiry. COnsequently, the website is constantly changing.

## Tech Stack
NextJS 16+
Velite+

## Development Roadmap
Initially a aesthetically accurate page with /, /posts, /about  
Navbar, Footer, Menu etc functional  

## Expand posts Replace Posts with the aforementioned segments (no subcategories yet) in the navbar and footer.  

The books get their own pages in /le chaos apprivale
Functioning core pages for each segment. Custom backgrounds.  
### Background Components:
1. Aquamarine: Balatro
2. Je Suis Le Chaos: Liquid Chrome
3. Al-Hawashi: Galaxy
4. Mana and Maghza: Web Threads
5. Hikayat Al Gharib: Lightfall
6. Fikr And Fana: Antigravity
7. Main Page, about: Aeroshards
8. le chaos apprivale: color bends

## Categories
### Le Chaos Apprivale
One page, with specified background. placeholder text saying what it is about.

Two Entries: Je Suis Le chaos and aquamarine; titles and icon with a brief synopsis. 

#### Aquamarine: Specified bg, a brief section summarizing stats(published chaps, last updated, current status), lists chapters in a linear list, 15 entries per page. Title, date. that's it. plain editorial literary style is my target.
#### Je Suis Le Chaos: Specified bg. Same as aquamarine.

### Al Hawashi, Mana Maghza: specified bg. description segment. three segments; each with paged grids of each cateogry(w a heading and a mini description of each subcat; listing only has title, date, optional icons(64px max))

### Hikayt al garib, fikr and fana: same style as aquamarine page.

Each of these type of content will have a minimal reader after opening them from their respective pages. No search or such, as its to be hosted in github sites, so constraints are a concern. its built once per major update manually, and kept as is w minimal load. private repo.

### About and Home:
Stylized pages to be fine tuned later. currently simply a text box w site name, w their bg. 

## Structure:
Metadata controlled through a lib file. rendering pipeline for mdx to use small react components in md file based websites w velite.
