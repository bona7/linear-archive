-- Function to increment boards_since_last_compression counter
CREATE OR REPLACE FUNCTION increment_board_counter(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_analysis (user_id, boards_since_last_compression, compressed_data)
  VALUES (p_user_id, 1, '')
  ON CONFLICT (user_id) 
  DO UPDATE SET boards_since_last_compression = user_analysis.boards_since_last_compression + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_board_counter(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_analysis (user_id, boards_since_last_compression, compressed_data)
  VALUES (p_user_id, 14, '')
  ON CONFLICT (user_id) 
  DO UPDATE SET boards_since_last_compression = 
    CASE 
      WHEN user_analysis.boards_since_last_compression = 0 THEN 14
      ELSE user_analysis.boards_since_last_compression - 1
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_board_counter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_board_counter(UUID) TO authenticated;
