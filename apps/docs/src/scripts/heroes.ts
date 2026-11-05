/** Seeds for the shuffle buttons: Marvel and DC heroes, by hero name and by secret identity. */
export const HEROES = [
  'Spider-Man',
  'Peter Parker',
  'Miles Morales',
  'Iron Man',
  'Tony Stark',
  'Captain Marvel',
  'Black Widow',
  'Wolverine',
  'Storm',
  'Black Panther',
  'Scarlet Witch',
  'Doctor Strange',
  'Thor',
  'Hulk',
  'Ms. Marvel',
  'Deadpool',
  'Rocket Raccoon',
  'Batman',
  'Bruce Wayne',
  'Wonder Woman',
  'Diana Prince',
  'Superman',
  'Clark Kent',
  'The Flash',
  'Aquaman',
  'Green Lantern',
  'Harley Quinn',
  'Catwoman',
  'Batgirl',
  'Nightwing',
  'Cyborg',
  'Supergirl',
  'Zatanna',
  'Starfire',
  'Raven',
]

/** A random hero other than the current seed, so every click changes the face. */
export const randomHero = (current: string) => {
  const pool = HEROES.filter((h) => h !== current)
  return pool[Math.floor(Math.random() * pool.length)]!
}
