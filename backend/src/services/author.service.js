
const { Author } = require('../models');
const { createAuditLog } = require('./audit.service');

/**
 * Helper: Create audit entry
 */
function createAuditEntry(userId, action, description) {
  return createAuditLog({
    userId,
    action,
    description,
  });
}

/**
 * Find or create authors from a comma-separated list
 * of author names.
 *
 * Only write audit log when a new author is created.
 */
async function findOrCreateAuthors(authorNames, userId) {
  if (
    !authorNames ||
    typeof authorNames !== 'string' ||
    !authorNames.trim()
  ) {
    return [];
  }

  const names = [
    ...new Set(
      authorNames
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    ),
  ];

  const authors = [];

  try {
    for (const name of names) {
      const [author, created] = await Author.findOrCreate({
        where: { name },
        defaults: { name },
      });

      authors.push(author);

      // Only log when a new author is created
      if (created && userId != null) {
        try {
          await createAuditEntry(
            userId,
            'author_create',
            `Successfully created author "${author.name}". Author ID: ${author.id}`
          );
        } catch (auditError) {
          console.error('Failed to save audit log:', auditError);
        }
      }
    }

    return authors;

  } catch (error) {

    // Find or create authors failed
    if (userId != null) {
      try {
        await createAuditEntry(
          userId,
          'author_find_or_create_failed',
          `Failed to find or create authors "${authorNames}". Reason: ${error.message}`
        );
      } catch (auditError) {
        console.error('Failed to save audit log:', auditError);
      }
    }

    throw error;
  }
}

/**
 * Create a new author
 */
async function createAuthor({ name, biography }, userId) {
  let author;

  try {
    if (!name || typeof name !== 'string' || !name.trim()) {
      const error = new Error('Tên tác giả là bắt buộc.');
      error.statusCode = 400;
      throw error;
    }

    author = await Author.create({
      name: name.trim(),
      biography,
    });

  } catch (error) {

    // Create failed -> Write failure audit
    if (userId != null) {
      try {
        await createAuditEntry(
          userId,
          'author_create_failed',
          `Failed to create author "${name || 'unknown'}". Reason: ${error.message}`
        );
      } catch (auditError) {
        console.error('Failed to save audit log:', auditError);
      }
    }

    throw error;
  }

  // Create successful -> Write success audit
  if (userId != null) {
    try {
      await createAuditEntry(
        userId,
        'author_create',
        `Successfully created author "${author.name}". Author ID: ${author.id}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }
  }

  return author;
}

/**
 * Get all authors
 */
async function getAllAuthors() {
  return await Author.findAll({
    order: [['name', 'ASC']],
  });
}

module.exports = {
  findOrCreateAuthors,
  createAuthor,
  getAllAuthors,
};
