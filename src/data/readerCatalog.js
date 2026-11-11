/**
 * Каталог книг в открытом доступе (Project Gutenberg, public domain).
 * id — числовой ebook ID на gutenberg.org; файл проксируется через /api/reader/book.
 * Добавляйте только произведения с истёкшим сроком авторских прав.
 */
export const READER_CATALOG = [
  { id: 1342, lang: 'en', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { id: 11, lang: 'en', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll' },
  { id: 84, lang: 'en', title: 'Frankenstein', author: 'Mary Shelley' },
  { id: 1661, lang: 'en', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
  { id: 345, lang: 'en', title: 'Dracula', author: 'Bram Stoker' },
  { id: 98, lang: 'en', title: 'A Tale of Two Cities', author: 'Charles Dickens' },
  { id: 174, lang: 'en', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
  { id: 74, lang: 'en', title: 'The Adventures of Tom Sawyer', author: 'Mark Twain' },
  { id: 2701, lang: 'en', title: 'Moby Dick', author: 'Herman Melville' },
  { id: 2554, lang: 'en', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
  { id: 1399, lang: 'en', title: 'Anna Karenina', author: 'Leo Tolstoy' },
  { id: 996, lang: 'en', title: 'Don Quixote', author: 'Miguel de Cervantes' },
  { id: 5200, lang: 'en', title: 'Metamorphosis', author: 'Franz Kafka' },
  { id: 1597, lang: 'en', title: "Andersen's Fairy Tales", author: 'Hans Christian Andersen' },
  { id: 4650, lang: 'fr', title: 'Candide, ou l\u2019optimisme', author: 'Voltaire' },
  { id: 17989, lang: 'fr', title: 'Le comte de Monte-Cristo, Tome I', author: 'Alexandre Dumas' },
  { id: 13846, lang: 'fr', title: 'Discours de la méthode', author: 'René Descartes' },
  { id: 2229, lang: 'de', title: 'Faust: Der Tragödie erster Teil', author: 'Johann Wolfgang von Goethe' },
  { id: 22367, lang: 'de', title: 'Die Verwandlung', author: 'Franz Kafka' },
  { id: 69327, lang: 'de', title: 'Der Prozess', author: 'Franz Kafka' },
  { id: 2000, lang: 'es', title: 'Don Quijote', author: 'Miguel de Cervantes' },
  { id: 1000, lang: 'it', title: 'La Divina Commedia', author: 'Dante Alighieri' },
  { id: 3333, lang: 'pt', title: 'Os Lusíadas', author: 'Luís de Camões' },
  { id: 55752, lang: 'pt', title: 'Dom Casmurro', author: 'Machado de Assis' },
  { id: 11024, lang: 'nl', title: 'Max Havelaar', author: 'Multatuli' },
  { id: 1982, lang: 'ja', title: '羅生門', author: '芥川龍之介' },
  { id: 25328, lang: 'zh', title: '豆棚閒話', author: '艾衲居士' },
];
