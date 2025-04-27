import React, { useState, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Keep all other imports the same
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Animated,
  Easing,
  useColorScheme,
  Switch,
  Dimensions,
  StatusBar,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons'; // Add this for icons

// Your existing code here...
const Stack = createNativeStackNavigator();

// Custom Theme Colors
const CustomTheme = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#0a3d62', // Dark Blue
      background: '#f5f5f5',
      card: 'white',
      text: '#333',
      border: '#ddd',
      accent: '#4a69bd',
      inactive: '#bdc3c7',
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#0a3d62', // Dark Blue
      background: '#121212',
      card: '#1e1e1e',
      text: '#f5f5f5',
      border: '#333',
      accent: '#4a69bd',
      inactive: '#555',
    },
  },
};

// AnimeRow Component
const AnimeRow = ({ item, onIncrement, onDecrement, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? CustomTheme.dark : CustomTheme.light;
  
  const calculateProgress = () => {
    if (!item.totalEpisodes) return 0;
    return (item.currentEpisode / item.totalEpisodes) * 100;
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => onPress(item));
  };

  return (
    <Animated.View style={[
      styles.animeItem, 
      { 
        backgroundColor: theme.colors.card,
        transform: [{ scale: scaleAnim }] 
      }
    ]}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.animeImage} />
      ) : (
        <View style={[styles.animeImagePlaceholder, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.animeImagePlaceholderText}>{item.title.charAt(0)}</Text>
        </View>
      )}
      
      <View style={styles.animeDetails}>
        <Text style={[styles.animeTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={{ color: theme.colors.text }}>
          Episodes: {item.currentEpisode}{item.totalEpisodes ? `/${item.totalEpisodes}` : ''}
        </Text>
        
        {item.totalEpisodes > 0 && (
          <View style={styles.progressBarContainer}>
            <View 
              style={[styles.progressBar, { width: `${calculateProgress()}%`, backgroundColor: theme.colors.accent }]} 
            />
          </View>
        )}
        
        <View style={styles.episodeButtons}>
          <TouchableOpacity 
            style={[styles.episodeButton, { backgroundColor: theme.colors.accent }]} 
            onPress={() => onDecrement(item.id)}
            disabled={item.currentEpisode <= 0}
          >
            <Text style={styles.episodeButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={[styles.episodeCount, { color: theme.colors.text }]}>
            {item.currentEpisode}
          </Text>
          
          <TouchableOpacity 
            style={[styles.episodeButton, { backgroundColor: theme.colors.accent }]} 
            onPress={() => onIncrement(item.id)}
            disabled={item.totalEpisodes && item.currentEpisode >= item.totalEpisodes}
          >
            <Text style={styles.episodeButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
        <Text style={{ color: theme.colors.accent }}>〉</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// AnimeDetails Screen
function AnimeDetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const [animeDetails, setAnimeDetails] = useState(item);
  const [title, setTitle] = useState(item.title);
  const [currentEpisode, setCurrentEpisode] = useState(item.currentEpisode.toString());
  const [totalEpisodes, setTotalEpisodes] = useState(item.totalEpisodes ? item.totalEpisodes.toString() : '');
  const [image, setImage] = useState(item.imageUri);
  const [status, setStatus] = useState(item.status);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? CustomTheme.dark : CustomTheme.light;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveChanges = async () => {
    const updatedAnime = {
      ...animeDetails,
      title,
      currentEpisode: parseInt(currentEpisode) || 0,
      totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : null,
      status,
      imageUri: image
    };

    try {
      // Get the current anime list
      const savedList = await AsyncStorage.getItem('animeList');
      const animeList = savedList ? JSON.parse(savedList) : [];
      
      // Update the specific anime
      const updatedList = animeList.map(anime => 
        anime.id === updatedAnime.id ? updatedAnime : anime
      );
      
      // Save back to storage
      await AsyncStorage.setItem('animeList', JSON.stringify(updatedList));
      
      // Navigate back and pass the updated anime for UI refresh
      navigation.navigate('Home', { updatedAnime });
    } catch (error) {
      console.error('Failed to save changes', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity 
            style={[styles.imagePicker, { borderColor: theme.colors.border }]} 
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.detailsImage} />
            ) : (
              <View style={[styles.detailsImagePlaceholder, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.detailsImagePlaceholderText}>{title.charAt(0)}</Text>
              </View>
            )}
            <Text style={[styles.changeImageText, { color: theme.colors.accent }]}>Change Image</Text>
          </TouchableOpacity>
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Title</Text>
          <TextInput
            style={[styles.detailsInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.colors.inactive}
          />
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Current Episode</Text>
          <TextInput
            style={[styles.detailsInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={currentEpisode}
            onChangeText={setCurrentEpisode}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.inactive}
          />
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Total Episodes</Text>
          <TextInput
            style={[styles.detailsInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={totalEpisodes}
            onChangeText={setTotalEpisodes}
            keyboardType="numeric"
            placeholder="Leave empty if ongoing"
            placeholderTextColor={theme.colors.inactive}
          />
          
          <View style={styles.statusContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Status</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === 'Watching' && { backgroundColor: theme.colors.accent }
                ]}
                onPress={() => setStatus('Watching')}
              >
                <Text style={[
                  styles.statusText,
                  status === 'Watching' ? { color: 'white' } : { color: theme.colors.text }
                ]}>Watching</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === 'Completed' && { backgroundColor: theme.colors.accent }
                ]}
                onPress={() => setStatus('Completed')}
              >
                <Text style={[
                  styles.statusText,
                  status === 'Completed' ? { color: 'white' } : { color: theme.colors.text }
                ]}>Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={saveChanges}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Home Screen
function HomeScreen({ route, navigation }) {
  const [animeList, setAnimeList] = useState([]);
  const [title, setTitle] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState('');
  const [image, setImage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false); // New state to toggle add form
  
  const colorScheme = useColorScheme();
  const theme = isDarkMode ? CustomTheme.dark : CustomTheme.light;

  useEffect(() => {
    loadAnimeList();
    requestMediaPermission();
    loadThemePreference();
  }, []);

  // Handle updates from details screen
  useEffect(() => {
    if (route.params?.updatedAnime) {
      loadAnimeList(); // Refresh the list
    }
  }, [route.params?.updatedAnime]);

  const requestMediaPermission = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const loadAnimeList = async () => {
    try {
      const savedList = await AsyncStorage.getItem('animeList');
      if (savedList) setAnimeList(JSON.parse(savedList));
    } catch (error) {
      console.error('Failed to load anime list', error);
    }
  };

  const saveAnimeList = async (list) => {
    try {
      await AsyncStorage.setItem('animeList', JSON.stringify(list));
    } catch (error) {
      console.error('Failed to save anime list', error);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      } else {
        // Default to system preference
        setIsDarkMode(colorScheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  };

  const saveThemePreference = async (isDark) => {
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDark));
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      saveThemePreference(newValue);
      return newValue;
    });
  };

  // Toggle the add form visibility
  const toggleAddForm = () => {
    if (!showAddForm) {
      // Reset form fields when opening
      setTitle('');
      setCurrentEpisode('');
      setTotalEpisodes('');
      setImage(null);
    } else {
      // Dismiss keyboard when closing form
      Keyboard.dismiss();
    }
    
    // Animate the form
    setShowAddForm(!showAddForm);
    fadeAnim.setValue(showAddForm ? 1 : 0);
    Animated.timing(fadeAnim, {
      toValue: showAddForm ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addAnime = () => {
    if (!title) return;
    
    const newAnime = {
      id: Date.now().toString(),
      title,
      currentEpisode: parseInt(currentEpisode) || 0,
      totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : null,
      status: 'Watching',
      imageUri: image
    };

    const updatedList = [...animeList, newAnime];
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
    
    // Hide form after adding and dismiss keyboard
    Keyboard.dismiss();
    toggleAddForm();
  };

  const incrementEpisode = (id) => {
    const updatedList = animeList.map(anime => {
      if (anime.id === id) {
        const newEpisode = anime.currentEpisode + 1;
        // Check if we reached total episodes
        if (anime.totalEpisodes && newEpisode >= anime.totalEpisodes) {
          return { ...anime, currentEpisode: anime.totalEpisodes, status: 'Completed' };
        }
        return { ...anime, currentEpisode: newEpisode };
      }
      return anime;
    });
    
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
  };

  const decrementEpisode = (id) => {
    const updatedList = animeList.map(anime => {
      if (anime.id === id && anime.currentEpisode > 0) {
        return { ...anime, currentEpisode: anime.currentEpisode - 1 };
      }
      return anime;
    });
    
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
  };

  const deleteAnime = (id) => {
    const updatedList = animeList.filter(anime => anime.id !== id);
    setAnimeList(updatedList);
    saveAnimeList(updatedList);
  };

  const renderSwipeableItem = ({ item }) => {
    const rightSwipe = (progress, dragX) => {
      const scale = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp'
      });
      
      return (
        <TouchableOpacity
          onPress={() => deleteAnime(item.id)}
          activeOpacity={0.6}
        >
          <View style={[styles.deleteBox, { backgroundColor: '#ff4444' }]}>
            <Animated.Text 
              style={{
                color: 'white',
                fontWeight: 'bold',
                transform: [{ scale }]
              }}
            >
              Delete
            </Animated.Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable renderRightActions={rightSwipe}>
        <AnimeRow 
          item={item} 
          onIncrement={incrementEpisode}
          onDecrement={decrementEpisode}
          onPress={(item) => navigation.navigate('Details', { item })}
        />
      </Swipeable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.headerText}>My Anime Tracker</Text>
          <View style={styles.headerControls}>
            <View style={styles.themeToggle}>
              <Text style={{ color: 'white', marginRight: 8 }}>🌙</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity onPress={toggleAddForm} style={styles.addIcon}>
              <MaterialIcons 
                name={showAddForm ? "close" : "add"} 
                size={28} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {showAddForm && (
          <Animated.View style={[
            styles.inputContainer, 
            { 
              backgroundColor: theme.colors.card,
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }]
            }
          ]}>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Anime title"
              placeholderTextColor={theme.colors.inactive}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Current episode"
              placeholderTextColor={theme.colors.inactive}
              value={currentEpisode}
              onChangeText={setCurrentEpisode}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Total episodes (optional)"
              placeholderTextColor={theme.colors.inactive}
              value={totalEpisodes}
              onChangeText={setTotalEpisodes}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              style={[styles.imageButton, { backgroundColor: theme.colors.accent }]}
              onPress={pickImage}
            >
              <Text style={styles.imageButtonText}>
                {image ? 'Change Image' : 'Add Image'}
              </Text>
            </TouchableOpacity>
            
            {image && (
              <Image 
                source={{ uri: image }} 
                style={styles.previewImage}
              />
            )}
            
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={addAnime}
            >
              <Text style={styles.addButtonText}>Add Anime</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <FlatList
          data={animeList}
          keyExtractor={(item) => item.id}
          renderItem={renderSwipeableItem}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
// Modified App component
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    loadThemePreference();
  }, []);
  
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      } else {
        setIsDarkMode(colorScheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={isDarkMode ? CustomTheme.dark : CustomTheme.light}>
        <Stack.Navigator>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Details" 
            component={AnimeDetailsScreen} 
            options={{ 
              title: 'Edit Anime',
              headerStyle: {
                backgroundColor: isDarkMode ? CustomTheme.dark.colors.primary : CustomTheme.light.colors.primary,
              },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  addIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  inputContainer: {
    padding: 20,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    height: 45,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  animeItem: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  animeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  animeImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animeImagePlaceholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  animeDetails: {
    flex: 1,
  },
  animeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
    marginVertical: 6,
    width: '100%',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  episodeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  episodeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  episodeCount: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  imageButton: {
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  deleteBox: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  listContainer: {
    paddingBottom: 20,
  },
  detailsButton: {
    marginLeft: 10,
    padding: 10,
  },
  addButton: {
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Details screen styles
  detailsContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  detailsImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  detailsImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsImagePlaceholderText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold'
  },
  changeImageText: {
    marginTop: 5,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  detailsInput: {
    height: 45,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  statusContainer: {
    marginVertical: 10,
  },
  statusOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontWeight: '500',
  },
  saveButton: {
    padding: 16,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});