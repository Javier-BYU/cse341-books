import { getAllBooks, getBookById } from '../models/books.js';

const getBooksHandler = async (req, res) => {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    console.error('GET /books failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getBookByIdHandler = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const book = await getBookById(requestedId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('GET /books/:id failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { getBookByIdHandler, getBooksHandler };