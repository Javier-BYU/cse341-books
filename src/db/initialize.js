import { getDb } from './connect.js';

const seedAuthors = [
  { id: 'a1', name: 'Jane Austen', birthYear: 1775 },
  { id: 'a2', name: 'Mark Twain', birthYear: 1835 },
  { id: 'a3', name: 'George Orwell', birthYear: 1903 },
];

const initializeDatabase = async () => {
  const db = getDb();
  const authors = db.collection('authors');
  const books = db.collection('books');

  await authors.createIndex({ id: 1 }, { unique: true });
  await books.createIndex({ authorId: 1 });
  await authors.bulkWrite(
    seedAuthors.map((author) => ({
      updateOne: {
        filter: { id: author.id },
        update: { $setOnInsert: author },
        upsert: true,
      },
    })),
  );
};

export { initializeDatabase };
