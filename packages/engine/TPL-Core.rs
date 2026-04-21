use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TplCommand {
    Set(String, String),
    AssertEq(String, String),
}

#[derive(Debug, Default)]
pub struct TplRuntime {
    state: HashMap<String, String>,
}

impl TplRuntime {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn execute(&mut self, command: TplCommand) -> Result<(), String> {
        match command {
            TplCommand::Set(key, value) => {
                self.state.insert(key, value);
                Ok(())
            }
            TplCommand::AssertEq(key, expected) => {
                let actual = self
                    .state
                    .get(&key)
                    .ok_or_else(|| format!("missing key: {}", key))?;

                if actual == &expected {
                    Ok(())
                } else {
                    Err(format!("assertion failed for {}: {} != {}", key, actual, expected))
                }
            }
        }
    }
}

pub fn parse_line(line: &str) -> Result<TplCommand, String> {
    let parts: Vec<&str> = line.split_whitespace().collect();

    match parts.as_slice() {
        ["SET", key, value] => Ok(TplCommand::Set((*key).to_string(), (*value).to_string())),
        ["ASSERT_EQ", key, value] => Ok(TplCommand::AssertEq((*key).to_string(), (*value).to_string())),
        _ => Err(format!("invalid TPL line: {}", line)),
    }
}
