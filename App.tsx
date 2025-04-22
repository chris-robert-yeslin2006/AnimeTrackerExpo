import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Anime = {
  id: string;
  title: string;
  currentEpisode: number;
  totalEpisodes?: number;
  status: 'Watching' | 'Completed';
};

export default function App() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [title, setTitle] = useState('');
  const [episode, setEpisode] = useState('');

  // Load saved anime on startup
  useEffect(() => {
    loadAnimeList();
  }, []);

  const loadAnimeList = async () => {
    try {
      const savedList = await AsyncStorage.getItem('animeList');
      if (savedList) setAnimeList(JSON.parse(savedList));
    } catch (error) {
      console.error('Failed to load anime list', error);
    }
  };

  const saveAnimeList = async (list: Anime[]) => {
    try {
      await AsyncStorage.setItem('animeList', JSON.stringify(list));
    } catch (error) {
      console.error('Failed to save anime list', error);
    }
  };

  const addAnime = () => {
    if (!title) return;
    
    const newAnime: Anime = {
      id: Date.now().toString(),
      title,
      currentEpisode: parseInt(episode) || 0,
      status: 'Watching'
    };

    const updatedList = [...animeList, newAnime];
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
    
    setTitle('');
    setEpisode('');
  };

  const toggleStatus = (id: string) => {
    const updatedList = animeList.map(anime => 
      anime.id === id 
        ? { ...anime, status: anime.status === 'Watching' ? 'Completed' : 'Watching' } 
        : anime
    );
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
  };

  const deleteAnime = (id: string) => {
    const updatedList = animeList.filter(anime => anime.id !== id);
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Anime Tracker</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Anime title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Current episode"
          value={episode}
          onChangeText={setEpisode}
          keyboardType="numeric"
        />
        <Button title="Add Anime" onPress={addAnime} />
      </View>

      <FlatList
        data={animeList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.animeItem}>
            <Text style={styles.animeTitle}>{item.title}</Text>
            <Text>Episode: {item.currentEpisode}{item.totalEpisodes ? `/${item.totalEpisodes}` : ''}</Text>
            <Text>Status: {item.status}</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.statusButton}
                onPress={() => toggleStatus(item.id)}
              >
                <Text>Toggle Status</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteAnime(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  animeItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  animeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statusButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  deleteButton: {
    padding: 5,
    backgroundColor: '#ff4444',
    borderRadius: 3,
  },
  deleteText: {
    color: 'white',
  },
});