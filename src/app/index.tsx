import { StyleSheet, Text, View } from 'react-native';

export default function Accueil() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le Scribe du Royaume</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17142B',
  },
  title: {
    color: '#EFE7D4',
    fontSize: 28,
  },
});
