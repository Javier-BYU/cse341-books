import { getDb } from './connect.js';

const seedAuthors = [
  { id: 'a1', name: 'Jane Austen', birthYear: 1775 },
  { id: 'a2', name: 'Mark Twain', birthYear: 1835 },
  { id: 'a3', name: 'George Orwell', birthYear: 1903 },
];

const seedBooks = [
  { id: 'b1', authorId: 'a1', title: 'Pride and Prejudice', publicationDate: '1813-01-28' },
  { id: 'b2', authorId: 'a2', title: 'The Adventures of Tom Sawyer', publicationDate: '1876-06-01' },
  { id: 'b3', authorId: 'a3', title: '1984', publicationDate: '1949-06-08' },
];

const initializeDatabase = async () => {
  const db = getDb();
  const authors = db.collection('authors');
  const books = db.collection('books');

  await authors.createIndex({ id: 1 }, { unique: true });
  await books.createIndex({ id: 1 }, { unique: true });
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
  const authorNames = new Map(seedAuthors.map((author) => [author.name, author.id]));
  for (const [name, id] of authorNames) {
    await books.updateMany(
      { $or: [{ author: name }, { authorName: name }, { name }] },
      { $set: { authorId: id }, $unset: { author: '', authorName: '' } },
    );
  }
  await books.bulkWrite(
    seedBooks.map((book) => ({
      updateOne: {
        filter: { id: book.id },
        update: { $setOnInsert: book },
        upsert: true,
      },
    })),
  );
};

export { initializeDatabase };
