import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme, spacing, radius } from '@/lib/theme';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MessageCircle } from 'lucide-react-native';
import { callCloudAI } from '@/lib/ai/cloud';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTION_CHIPS = [
  'How do I read my lab results?',
  'How should I prepare for a doctor visit?',
  'What belongs in my health record?',
  'Where do I upload a PDF?',
];

let messageSequence = 0;
function createMessage(type: Message['type'], text: string): Message {
  messageSequence += 1;
  return {
    id: `${type}-${Date.now()}-${messageSequence}`,
    type,
    text,
    timestamp: new Date(),
  };
}

export default function ChatScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isTablet = width >= 768;

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = createMessage('user', text.trim());

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const answer = await callCloudAI({
        systemPrompt: '',
        userMessage: userMessage.text,
        conversationHistory: messages.map((message) => ({
          role: message.type === 'user' ? 'user' : 'assistant',
          content: message.text,
        })),
      });
      const assistantMessage = createMessage('assistant', answer);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : 'UMA chat is unavailable. Try again later.';
      setMessages((prev) => [...prev, createMessage('assistant', message)]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isUser ? 'flex-end' : 'flex-start', marginVertical: spacing.sm },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? theme.accent : theme.panel2,
              borderColor: theme.border,
              maxWidth: isTablet ? '60%' : '80%',
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? (theme.fg === '#151515' ? '#ffffff' : theme.bg) : theme.fg },
            ]}
          >
            {item.text}
          </Text>
          {item.type === 'assistant' && (
            <Text style={[styles.disclaimerText, { color: theme.muted, marginTop: spacing.sm }]}>
              Not medical advice
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (messages.length > 0) return null;

    return (
      <View style={[styles.emptyState, { width: isTablet ? '60%' : '100%' }]}>
        <MessageCircle size={48} color={theme.accent} strokeWidth={1.5} />
        <Text style={[styles.emptyTitle, { color: theme.fg, marginTop: spacing.lg }]}>
          Hello, I’m UMA
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.muted, marginTop: spacing.sm }]}>
          Your personal health companion. Ask me anything about your health records and medications.
        </Text>

        <View style={[styles.suggestionsContainer, { marginTop: spacing.xl }]}>
          {SUGGESTION_CHIPS.map((chip, i) => (
            <Button
              key={i}
              title={chip}
              variant="outline"
              size="sm"
              onPress={() => { void handleSendMessage(chip); }}
              style={{ marginBottom: spacing.md }}
            />
          ))}
        </View>

        <View style={[styles.disclaimer, { marginTop: spacing.xl, borderTopColor: theme.border }]}>
          <Text style={[styles.disclaimerText, { color: theme.muted }]}>
            UMA provides health information based on your records. It is not a substitute for
            professional medical advice. Always consult your doctor.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
            messages.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState()}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={[styles.loadingIndicator, { paddingHorizontal: spacing.lg }]}>
            <ActivityIndicator color={theme.accent} size="small" />
            <Text style={[styles.loadingText, { color: theme.muted, marginLeft: spacing.md }]}>
              Uma is thinking...
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: theme.border,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.inputRow}>
            <Button
              title="Attach"
              onPress={() => {}}
              variant="ghost"
              size="sm"
              style={{ flex: 0, paddingHorizontal: spacing.sm }}
            />

            <TextInput
              placeholder="Ask me anything..."
              value={input}
              onChangeText={setInput}
              editable={!loading}
              onSubmitEditing={() => { void handleSendMessage(); }}
              returnKeyType="send"
              style={{ flex: 1, marginHorizontal: spacing.sm }}
            />

            <Button
              title="Send"
              onPress={() => { void handleSendMessage(); }}
              disabled={!input.trim() || loading}
              variant="ghost"
              size="sm"
              style={{ flex: 0, paddingHorizontal: spacing.sm }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'fraunces-bold',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'space-grotesk',
    lineHeight: 20,
  },
  suggestionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'space-grotesk',
  },
  disclaimer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'space-grotesk',
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'space-grotesk',
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
