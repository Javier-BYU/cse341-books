import {
  getAllAuthors as getAllAuthorsFromDb,
  getAuthorById as getAuthorByIdFromDb,
  createAuthor as createAuthorInDb,
  updateAuthor as updateAuthorInDb,
  deleteAuthor as deleteAuthorFromDb,
  authorHasBooks,
} from '../models/authors.js';

const currentYear = new Date().getFullYear();
const authorIdPattern = /^a[0-9]+$/;

const sendValidationError = (res, details) =>
  res.status(400).json({ error: 'Validation failed', details });

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

const validateAuthor = (body, { update = false, routeId } = {}) => {
  const details = [];
  const allowedFields = ['id', 'name', 'birthYear'];

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
      } else if (id.length > 20 || !authorIdPattern.test(id)) {
        details.push('id must match ^a[0-9]+$ and be at most 20 characters');
      } else if (update && id !== routeId) {
        details.push('id must match the URL id');
      }
    }
  }

  let name;
  if (typeof body.name !== 'string') {
    details.push('name must be a string');
  } else {
    name = body.name.trim();
    if (!name) {
      details.push('name is required');
    } else if (name.length > 100) {
      details.push('name must be at most 100 characters');
    }
  }

  const birthYear = body.birthYear;
  if (typeof birthYear !== 'number' || !Number.isInteger(birthYear)) {
    details.push('birthYear must be an integer');
  } else if (birthYear < 1 || birthYear > currentYear) {
    details.push(`birthYear must be between 1 and ${currentYear}`);
  }

  if (details.length > 0) {
    return { details };
  }

  return {
    value: update ? { name, birthYear } : { id, name, birthYear },
  };
};

const logAndRespondWithServerError = (res, route, error) => {
  console.error(`${route} failed:`, error);
  return res.status(500).json({ error: 'Internal server error' });
};

const getAllAuthors = async (req, res) => {
  const limit = getPaginationValue(req.query.limit, 'limit', 1, 100, 50);
  const skip = getPaginationValue(req.query.skip, 'skip', 0, Number.MAX_SAFE_INTEGER, 0);
  const details = [limit.error, skip.error].filter(Boolean);

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  try {
    const authors = await getAllAuthorsFromDb({ limit: limit.value, skip: skip.value });
    return res.status(200).json(authors);
  } catch (error) {
    return logAndRespondWithServerError(res, 'GET /authors', error);
  }
};

const getAuthorById = async (req, res) => {
  try {
    const author = await getAuthorByIdFromDb(req.params.id);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    return res.status(200).json(author);
  } catch (error) {
    return logAndRespondWithServerError(res, 'GET /authors/:id', error);
  }
};

const createAuthor = async (req, res) => {
  const validation = validateAuthor(req.body);
  if (validation.details) {
    return sendValidationError(res, validation.details);
  }

  try {
    const author = await createAuthorInDb(validation.value);
    return res
      .location(`/authors/${author.id}`)
      .status(201)
      .json(author);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An author with this id already exists' });
    }

    return logAndRespondWithServerError(res, 'POST /authors', error);
  }
};

const updateAuthor = async (req, res) => {
  const validation = validateAuthor(req.body, { update: true, routeId: req.params.id });
  if (validation.details) {
    return sendValidationError(res, validation.details);
  }

  try {
    const author = await updateAuthorInDb(req.params.id, validation.value);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    return res.status(200).json(author);
  } catch (error) {
    return logAndRespondWithServerError(res, 'PUT /authors/:id', error);
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const author = await getAuthorByIdFromDb(req.params.id);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    if (await authorHasBooks(req.params.id)) {
      return res.status(409).json({
        error: 'Author cannot be deleted because one or more books reference it',
      });
    }

    const deleted = await deleteAuthorFromDb(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Author not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return logAndRespondWithServerError(res, 'DELETE /authors/:id', error);
  }
};

export { getAllAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
