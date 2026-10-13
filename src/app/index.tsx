

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


import AsyncStorage from '@react-native-async-storage/async-storage';
// pentru Supabase : 
import { supabase } from '../lib/supabase';


// O notiță salvată: are id unic, titlu și descriere.
type Note = {
  id: string;
  title: string;
  description: string;
};

// Ciorna din formular (ce scrii acum), încă fără id.
type Draft = {
  title: string;
  description: string;
};
// const STORAGE_KEY = 'notes'; se poate sterge pentru ca am migrat la supabase si nu mai folosim AsyncStorage pentru salvarea notitelor.
const STORAGE_KEY = 'notes';


// function App() e o componentă: o funcție care returnează ce se vede pe ecran.export default
// o face exportul principal al fișierului. Expo Router caută exact asta în src/app/index.tsx ca să știe ce să afișeze la pornire.
export default function App() {
  // Ce scrie utilizatorul acum în formular.
  const [note, setNote] = useState<Draft>({ title: '', description: '' });

  // Lista tuturor notițelor salvate.
  const [notes, setNotes] = useState<Note[]>([]);

  // NOU: id-ul notiței pe care o edităm acum.
  // Dacă e null, formularul creează o notiță nouă.
  // Dacă are o valoare, formularul modifică notița cu id-ul respectiv.
  const [editingId, setEditingId] = useState<string | null>(null);

  // La pornirea aplicației citim notițele salvate pe telefon.
  useEffect(() => {
    loadNotes();
  }, []);

  // Salvează lista pe telefon și o pune în state.
  const persist = async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      Alert.alert('Error', 'Could not save your notes.');
    }
  };

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

  // NOU: golește formularul și iese din modul de editare.
  const resetForm = () => {
    setNote({ title: '', description: '' });
    setEditingId(null);
  };

  // NOU: apelată când apeși pe o notiță din listă.
  // Copiază titlul și descrierea ei în formular și reține id-ul ei.
  const startEditing = (item: Note) => {
    setNote({ title: item.title, description: item.description });
    setEditingId(item.id);
  };

  // Apelată de butonul Save / Update.
  const saveNote = async () => {
  // Nu salvăm notițe complet goale.
  if (!note.title.trim() && !note.description.trim()) {
    return;
  }

  if (editingId) {
    // MODUL EDITARE: acum modificăm rândul în Supabase (litera U din CRUD).
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
    // MODUL NOTIȚĂ NOUĂ: neschimbat, salvăm în Supabase (litera C).
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

  // În ambele cazuri reîncărcăm lista din Supabase și golim formularul.
  await loadNotes();
  resetForm();
};

  // Șterge notița cu id-ul primit.
 const deleteNote = async (id: string) => {
  // Ștergem rândul din Supabase (litera D din CRUD).
  const { error } = await supabase.from('notes').delete().eq('id', id);

  if (error) {
    console.log(error);
    Alert.alert('Error', 'Could not delete your note.');
    return;
  }

  // Dacă ștergem notița pe care o edităm, golim formularul.
  if (id === editingId) {
    resetForm();
  }

  // Reîncărcăm lista din Supabase.
  await loadNotes();
};

  // Confirmare înainte de ștergere (merge și pe web, și pe telefon).
  const deleteNoteAlert = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this note?')) {
        deleteNote(id);
      }
      return;
    }

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

  // Numără cuvintele dintr-un text.
  const countWords = (text: string) => {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  };

  // Cum arată fiecare notiță din listă.
  const renderItem: ListRenderItem<Note> = ({ item }) => (
    <View
      style={[
        styles.noteContainer,
        // NOU: notița pe care o edităm acum primește un chenar albastru.
        item.id === editingId && styles.noteBeingEdited,
      ]}
    >
      {/* NOU: partea cu textul e acum apăsabilă. Apăsarea ei pornește editarea. */}
      <TouchableOpacity style={styles.noteTextBox} onPress={() => startEditing(item)}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text>{item.description}</Text>
      </TouchableOpacity>

      {/* Butonul Delete e separat, deci apăsarea lui nu pornește editarea. */}
      <TouchableOpacity onPress={() => deleteNoteAlert(item.id)}>
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      // asta afiseaza titlul :
      <View style={styles.header}>
        <Text style={styles.title}>Notepad</Text>
        <Text style={styles.subtitle}>Access your notes</Text>
    </View>
      <View style={styles.form}>
        {/* NOU: un mic text care apare doar când edităm. */}
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
          {/* Textul butonului se schimbă: Update când edităm, Save când creăm. */}
          <Button title={editingId ? 'Update' : 'Save'} onPress={saveNote} />

          {/* NOU: butonul Cancel apare doar în modul de editare. */}
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
    // ...restul rămâne la fel
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
  // NOU: textul "Editing note" din formular.
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
  // NOU: pune butoanele Save/Update și Cancel unul lângă altul.
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Lățimea listei (rezolvă problema cu textul care dispărea).
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
  // NOU: chenarul albastru al notiței pe care o edităm.
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
