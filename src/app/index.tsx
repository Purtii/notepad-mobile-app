import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Button,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  ListRenderItem,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Note = {
  id: string;
  title: string;
  description: string;
};

type Draft = {
  title: string;
  description: string;
};

export default function App() {
  const [note, setNote] = useState<Draft>({ title: '', description: '' });
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select()
      .order('created_at', { ascending: true });

    if (error) {
      console.log(error);
      Alert.alert('Error', 'Could not load your notes.');
      return;
    }

    setNotes((data ?? []) as Note[]);
  };

  const resetForm = () => {
    setNote({ title: '', description: '' });
    setEditingId(null);
  };

  const startEditing = (item: Note) => {
    setNote({ title: item.title, description: item.description });
    setEditingId(item.id);
  };

  const saveNote = async () => {
    if (!note.title.trim() && !note.description.trim()) {
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('notes')
        .update({
          title: note.title.trim(),
          description: note.description.trim(),
        })
        .eq('id', editingId);

      if (error) {
        console.log(error);
        Alert.alert('Error', 'Could not update your note.');
        return;
      }
    } else {
      const { error } = await supabase.from('notes').insert({
        title: note.title.trim(),
        description: note.description.trim(),
      });

      if (error) {
        console.log(error);
        Alert.alert('Error', 'Could not save your note.');
        return;
      }
    }

    await loadNotes();
    resetForm();
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      console.log(error);
      Alert.alert('Error', 'Could not delete your note.');
      return;
    }

    if (id === editingId) {
      resetForm();
    }

    await loadNotes();
  };

  const deleteNoteAlert = (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => deleteNote(id) },
      ],
      { cancelable: false },
    );
  };

  const countWords = (text: string) => {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  };

  const renderItem: ListRenderItem<Note> = ({ item }) => (
    <View
      style={[
        styles.noteContainer,
        item.id === editingId && styles.noteBeingEdited,
      ]}
    >
      <TouchableOpacity style={styles.noteTextBox} onPress={() => startEditing(item)}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text>{item.description}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteNoteAlert(item.id)}>
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notepad</Text>
        <Text style={styles.subtitle}>Access your notes</Text>
      </View>
      <View style={styles.form}>
        {editingId && <Text style={styles.editingLabel}>Editing note</Text>}

        <TextInput
          style={styles.input}
          placeholder="Title"
          value={note.title}
          onChangeText={(text) => setNote({ ...note, title: text })}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          multiline={true}
          numberOfLines={4}
          value={note.description}
          onChangeText={(text) => setNote({ ...note, description: text })}
        />

        <Text style={styles.counter}>
          {countWords(note.description)} words · {note.description.length} characters
        </Text>

        <View style={styles.buttonRow}>
          <Button title={editingId ? 'Update' : 'Save'} onPress={saveNote} />

          {editingId && <Button title="Cancel" color="gray" onPress={resetForm} />}
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={notes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.noteList}
        ListEmptyComponent={<Text style={styles.emptyListText}>No notes found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  header: {
    width: '90%',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  form: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20%',
    marginBottom: 20,
  },
  editingLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    width: '100%',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: 'gray',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  list: {
    width: '90%',
  },
  noteList: {
    paddingBottom: 20,
  },
  noteContainer: {
    width: '100%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  noteBeingEdited: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  noteTextBox: {
    flex: 1,
  },
  noteTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  deleteButton: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
  },
});
