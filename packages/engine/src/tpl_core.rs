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
                    Err(format!(
                        "assertion failed for {}: expected '{}' but got '{}'",
                        key, expected, actual
                    ))
                }
            }
        }
    }
}

pub fn parse_line(line: &str) -> Result<TplCommand, String> {
    let parts: Vec<&str> = line.split_whitespace().collect();

    match parts.as_slice() {
        ["SET", key, value] => Ok(TplCommand::Set((*key).to_string(), (*value).to_string())),
        ["ASSERT_EQ", key, value] => {
            Ok(TplCommand::AssertEq((*key).to_string(), (*value).to_string()))
        }
        _ => Err(format!("invalid TPL line: {}", line)),
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_line, TplCommand, TplRuntime};

    #[test]
    fn parse_line_handles_valid_and_invalid_input() {
        assert_eq!(
            parse_line("SET mode active").expect("SET should parse"),
            TplCommand::Set("mode".to_string(), "active".to_string())
        );

        assert_eq!(
            parse_line("ASSERT_EQ mode active").expect("ASSERT_EQ should parse"),
            TplCommand::AssertEq("mode".to_string(), "active".to_string())
        );

        assert!(parse_line("").is_err());
        assert!(parse_line("UNKNOWN a b").is_err());
        assert!(parse_line("SET only_key").is_err());
    }

    #[test]
    fn execute_returns_expected_errors() {
        let mut runtime = TplRuntime::new();

        let missing = runtime
            .execute(TplCommand::AssertEq(
                "missing".to_string(),
                "value".to_string(),
            ))
            .expect_err("missing key should fail");
        assert!(missing.contains("missing key"));

        runtime
            .execute(TplCommand::Set("mode".to_string(), "active".to_string()))
            .expect("set should succeed");

        let mismatch = runtime
            .execute(TplCommand::AssertEq(
                "mode".to_string(),
                "inactive".to_string(),
            ))
            .expect_err("mismatched values should fail");
        assert!(mismatch.contains("expected 'inactive' but got 'active'"));
    }
}
