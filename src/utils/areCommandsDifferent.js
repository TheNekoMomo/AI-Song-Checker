// @ts-check

/** @typedef {import('../types').Command} Command */
/** @typedef {import('../types').CommandOption} CommandOption */

/**
 * Compare two Command objects and return true if they differ.
 *
 * @function AreCommandsDifferent
 * @param {import('discord.js').ApplicationCommand} existingCommand - The first command to compare (usually the registered one).
 * @param {Command} localCommand - The second command to compare (usually the local definition).
 * @returns {boolean} True if the commands are different.
 */
function AreCommandsDifferent(existingCommand, localCommand) 
{
    const areChoicesDifferent = (existingChoices, localChoices) => {
    for (const localChoice of localChoices) {
      const existingChoice = existingChoices?.find(
        (choice) => choice.name === localChoice.name
      );

      if (!existingChoice) {
        return true;
      }

      if (localChoice.value !== existingChoice.value) {
        return true;
      }
    }
    return false;
  };

  const areOptionsDifferent = (existingOptions, localOptions) => {
    for (const localOption of localOptions) {
      const existingOption = existingOptions?.find(
        (option) => option.name === localOption.name
      );

      if (!existingOption) {
        return true;
      }

      if (
        localOption.description !== existingOption.description ||
        localOption.type !== existingOption.type ||
        (localOption.required || false) !== existingOption.required ||
        (localOption.choices?.length || 0) !==
          (existingOption.choices?.length || 0) ||
        areChoicesDifferent(
          localOption.choices || [],
          existingOption.choices || []
        )
      ) {
        return true;
      }
    }
    return false;
  };

  if (
    existingCommand.description !== localCommand.description ||
    existingCommand.options?.length !== (localCommand.options?.length || 0) ||
    areOptionsDifferent(existingCommand.options, localCommand.options || [])
  ) {
    return true;
  }

  return false;
}

module.exports = AreCommandsDifferent;