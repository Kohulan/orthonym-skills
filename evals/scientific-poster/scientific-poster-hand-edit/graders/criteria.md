---
type: llm
---

PASS if the steps back up the user's edited pptx first, change only that one line inside their file (for example in the slide XML, keeping its formatting) instead of rebuilding from the build script, copy the same change into the build script so a later rebuild keeps it, and then validate, check font sizes and render the user's file to look at the changed region.
FAIL if the steps rebuild the poster from the script (which would erase the user's own edits), change other content, skip the backup, or ask the user to make the change themselves without offering to do it.
