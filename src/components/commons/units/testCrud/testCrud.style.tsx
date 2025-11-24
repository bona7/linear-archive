import styled from "@emotion/styled";

export const Container = styled.div`
  min-height: 90vh;
  padding: 40px 20px;
  font-family: "Pretendard", sans-serif;
  max-width: 1000px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
  }

  p {
    text-align: center;
    margin-bottom: 30px;
    color: #666;
  }
`;

export const Form = styled.form`
  background: #f5f5f5;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;

  h2 {
    margin-bottom: 20px;
    color: #333;
  }

  div {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    input[type="text"],
    input[type="date"],
    input[type="file"],
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      font-family: "Pretendard", sans-serif;

      &:focus {
        outline: none;
        border-color: #4CAF50;
      }
    }

    textarea {
      resize: vertical;
    }
  }
`;

export const Button = styled.button`
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover:not(:disabled) {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const BoardList = styled.div`
  h2 {
    margin-bottom: 20px;
    color: #333;
  }
`;

export const BoardItem = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  h3 {
    margin-bottom: 10px;
    color: #333;
    font-size: 16px;
    word-break: break-all;
  }

  p {
    margin: 8px 0;
    color: #555;
    text-align: left;
  }
`;

export const Error = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

