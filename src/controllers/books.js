import {
  authorExists,
  createBook as createBookInDb,
  deleteBook as deleteBookFromDb,
  getAllBooks as getAllBooksFromDb,
  getBookById as getBookByIdFromDb,
  updateBook as updateBookInDb,
} from '../models/books.js';

const bookIdPattern = /^b[0-9]+$/;
const authorIdPattern = /^a[0-9]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const sendValidationError = (res, details) =>
  res.status(400).json({ error: 'Validation failed', details });

const logAndRespondWithServerError = (res, route, error) => {
  console.error(`${route} failed:`, error);
  return res.status(500).json({ error: 'Internal server error' });
};

const getPaginationValue = (value, name, minimum, maximum, defaultValue) => {
  if (value === undefined) {
    return { value: defaultValue };
  }

  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    return { error: `${name} must be an integer` };
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    return { error: `${name} must be between ${minimum} and ${maximum}` };
  }

  return { value: parsedValue };
};

const isRealDate = (value) => {
  if (value.startsWith('0000')) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value;
};

const validateBook = (body, { update = false, routeId } = {}) => {
  const details = [];
  const allowedFields = update ? ['id', 'authorId', 'title', 'publicationDate'] : ['id', 'authorId', 'title', 'publicationDate'];

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { details: ['Request body must be a JSON object'] };
  }

  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      details.push(`${field} is not allowed`);
    }
  }

  let id;
  if (!update || Object.hasOwn(body, 'id')) {
    if (typeof body.id !== 'string') {
      details.push('id must be a string');
    } else {
      id = body.id.trim();
      if (!id) {
        details.push('id is required');
      } else if (id.length > 20 || !bookIdPattern.test(id)) {
        details.push('id must match ^b[0-9]+$ and be at most 20 characters');
      } else if (update && id !== routeId) {
        details.push('id must match the URL id');
      }
    }
  }

  let authorId;
  if (typeof body.authorId !== 'string') {
    details.push('authorId must be a string');
  } else {
    authorId = body.authorId.trim();
    if (!authorId) {
      details.push('authorId is required');
    } else if (authorId.length > 20 || !authorIdPattern.test(authorId)) {
      details.push('authorId must match ^a[0-9]+$ and be at most 20 characters');
    }
  }

  let title;
  if (typeof body.title !== 'string') {
    details.push('title must be a string');
  } else {
    title = body.title.trim();
    if (!title) {
      details.push('title is required');
    } else if (title.length > 200) {
      details.push('title must be at most 200 characters');
    }
  }

  let publicationDate;
  if (typeof body.publicationDate !== 'string') {
    details.push('publicationDate must be a string');
  } else {
    publicationDate = body.publicationDate.trim();
    if (!datePattern.test(publicationDate) || !isRealDate(publicationDate)) {
      details.push('publicationDate must be a real date in YYYY-MM-DD format');
    }
  }

  if (details.length > 0) {
    return { details };
  }

  return {
    value: update ? { authorId, title, publicationDate } : { id, authorId, title, publicationDate },
  };
};

const getBooksHandler = async (req, res) => {
  const authorId = req.query.authorId;
  const limit = getPaginationValue(req.query.limit, 'limit', 1, 100, 50);
  const skip = getPaginationValue(req.query.skip, 'skip', 0, Number.MAX_SAFE_INTEGER, 0);
  const details = [limit.error, skip.error];

  const normalizedAuthorId = typeof authorId === 'string' ? authorId.trim() : authorId;
  if (normalizedAuthorId !== undefined
    && (typeof normalizedAuthorId !== 'string'
      || normalizedAuthorId.length > 20
      || !authorIdPattern.test(normalizedAuthorId))) {
    details.push('authorId must match ^a[0-9]+$ and be at most 20 characters');
  }

  const validationDetails = details.filter(Boolean);
  if (validationDetails.length > 0) {
    return sendValidationError(res, validationDetails);
  }

  try {
    const books = await getAllBooksFromDb({
      authorId: normalizedAuthorId,
      limit: limit.value,
      skip: skip.value,
    });
    return res.status(200).json(books);
  } catch (error) {
    return logAndRespondWithServerError(res, 'GET /books', error);
  }
};

const getBookByIdHandler = async (req, res) => {
  try {
    const book = await getBookByIdFromDb(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.status(200).json(book);
  } catch (error) {
    return logAndRespondWithServerError(res, 'GET /books/:id', error);
  }
};

const createBook = async (req, res) => {
  const validation = validateBook(req.body);
  if (validation.details) {
    return sendValidationError(res, validation.details);
  }

  try {
    if (!(await authorExists(validation.value.authorId))) {
      return res.status(400).json({ error: 'Author not found' });
    }

    const book = await createBookInDb(validation.value);
    return res.location(`/books/${book.id}`).status(201).json(book);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A book with this id already exists' });
    }
    return logAndRespondWithServerError(res, 'POST /books', error);
  }
};

const updateBook = async (req, res) => {
  const validation = validateBook(req.body, { update: true, routeId: req.params.id });
  if (validation.details) {
    return sendValidationError(res, validation.details);
  }

  try {
    if (!(await getBookByIdFromDb(req.params.id))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (!(await authorExists(validation.value.authorId))) {
      return res.status(400).json({ error: 'Author not found' });
    }

    return res.status(200).json(await updateBookInDb(req.params.id, validation.value));
  } catch (error) {
    return logAndRespondWithServerError(res, 'PUT /books/:id', error);
  }
};

const deleteBook = async (req, res) => {
  try {
    if (!(await deleteBookFromDb(req.params.id))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return logAndRespondWithServerError(res, 'DELETE /books/:id', error);
  }
};

export { getBookByIdHandler, getBooksHandler, createBook, updateBook, deleteBook };
