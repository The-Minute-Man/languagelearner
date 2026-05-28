import { useState } from 'react';

export function useCloudDecks(supabaseClient, session, activeClassId, isAdmin, showAlert) {
  const [cloudDecks, setCloudDecks] = useState([]);
  const [cloudLoading, setCloudLoading] = useState(false);

  const fetchCloudDecks = async () => {
    if (!supabaseClient) return;
    if (!isAdmin && !activeClassId) {
      setCloudDecks([]);
      return;
    }
    setCloudLoading(true);
    try {
      let query = supabaseClient.from('decks').select('*');
      if (activeClassId) query = query.eq('class_id', activeClassId);
      const { data: decksData, error: decksError } = await query;
      if (decksError) throw decksError;
      const decksWithCards = [];
      for (const d of decksData) {
        const { data: cardsData, error: cardsError } = await supabaseClient
          .from('cards')
          .select('*')
          .eq('deck_id', d.id);
        if (!cardsError) {
          decksWithCards.push({
            id: d.id,
            name: d.name,
            description: d.description,
            cards: cardsData.map(c => ({ id: c.id, term: c.term, definition: c.definition }))
          });
        }
      }
      setCloudDecks(decksWithCards);
    } catch (err) {
      console.error("Fetch Cloud Decks Error:", err);
      if (showAlert) showAlert({ title: 'Error', message: err.message, variant: 'error' });
    } finally {
      setCloudLoading(false);
    }
  };

  const handleSaveGlobalDeck = async (getActiveDeck, resolvePublishClassId, activeClass, showBanner) => {
    if (!isAdmin) return;
    const activeDeck = getActiveDeck();
    if (!supabaseClient || activeDeck.length === 0) return;

    const publishClassId = await resolvePublishClassId();
    if (!publishClassId) {
      if (showAlert) showAlert({ title: 'No class selected', message: 'Join a class in Settings before publishing a deck.', variant: 'error' });
      return;
    }

    const deckNameInput = await showAlert({ title: 'Name this study deck', message: `Students in ${activeClass?.name || 'Spanish 200'} will see this deck in the library.`, variant: 'prompt' });
    if (!deckNameInput) return;

    try {
      const { data: deckData, error: deckError } = await supabaseClient
        .from('decks')
        .insert({
          name: deckNameInput,
          description: `Official deck for ${activeClass?.name || 'Spanish 200'}`,
          user_id: session.user.id,
          is_global: true,
          class_id: publishClassId,
        })
        .select()
        .single();

      if (deckError) throw deckError;

      const cardsToInsert = activeDeck.map(c => ({ deck_id: deckData.id, term: c.term, definition: c.definition }));
      const { error: cardsError } = await supabaseClient.from('cards').insert(cardsToInsert);
      if (cardsError) throw cardsError;

      if (showBanner) showBanner(`Deck published for ${activeClass?.name || 'Spanish 200'}.`, 'success');
      fetchCloudDecks();
    } catch (err) {
      console.error(err);
      if (showAlert) showAlert({ title: 'Could not publish deck', message: err.message, variant: 'error' });
    }
  };

  return { cloudDecks, cloudLoading, fetchCloudDecks, handleSaveGlobalDeck };
}
