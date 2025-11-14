import styled from "@emotion/styled";

export const Container = styled.div`
  min-height: 90vh;
  padding: 40px 20px;
  font-family: "Pretendard", sans-serif;
  max-width: 600px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }
`;

export const Form = styled.form`
  background: #f5f5f5;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

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

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #4CAF50;
      }
    }
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: 12px;
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

export const Info = styled.div`
  background: #e8f5e9;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin-bottom: 15px;
    color: #2e7d32;
  }

  p {
    margin: 10px 0;
    color: #555;
    word-break: break-all;
  }
`;

export const Error = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
`;

