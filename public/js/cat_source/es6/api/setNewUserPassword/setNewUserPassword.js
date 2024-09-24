/**
 * Reset password user
 *
 * @param {string} password
 * @param {string} passwordConfimation
 * @returns {Promise<object>}
 */
export const setNewUserPassword = async (password, passwordConfimation) => {
  const paramsData = {
    password,
    password_confirmation: passwordConfimation,
  }
  const formData = new FormData()

  Object.keys(paramsData).forEach((key) => {
    formData.append(key, paramsData[key])
  })

  let url = `/api/app/user/password`

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  // if (!response.ok) return Promise.reject(response)

  const {errors, ...data} = await response.json()
  if (errors && errors.length > 0) return Promise.reject(errors)
  return data
}
