import { getDb } from '../db/connect.js';

const authorProjection = { _id: 0, id: 1, name: 1, birthYear: 1 };

const getAllAuthors = async ({ limit, skip }) => {
  const collection = getDb().collection('authors');
  return collection
    .find({}, { projection: authorProjection })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
};

const getAuthorById = async (id) => {
  const collection = getDb().collection('authors');
  return collection.findOne({ id }, { projection: authorProjection });
};

const createAuthor = async (author) => {
  const collection = getDb().collection('authors');
  await collection.insertOne(author);
  return { id: author.id, name: author.name, birthYear: author.birthYear };
};

const updateAuthor = async (id, author) => {
  const collection = getDb().collection('authors');
  const result = await collection.updateOne({ id }, { $set: author });
  if (result.matchedCount === 0) {
    return null;
  }

  return getAuthorById(id);
};

const deleteAuthor = async (id) => {
  const collection = getDb().collection('authors');
  const result = await collection.deleteOne({ id });
  return result.deletedCount === 1;
};

const authorHasBooks = async (id) => {
  const collection = getDb().collection('books');
  return Boolean(await collection.findOne({ authorId: id }, { projection: { _id: 1 } }));
};

export {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  authorHasBooks,
};
